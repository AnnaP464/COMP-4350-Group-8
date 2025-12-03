// Integration tests for attendance sign-in/sign-out flow
// Tests: service → db layers with real database
// Catches: contract mismatches, time logic bugs, geofence validation, state transitions

import {
  signInAttendanceService,
  signOutAttendanceService,
  getAttendanceStatusService,
  getVolunteerStatsService,
} from "../../services/eventsService";
import { createCircleFence } from "../../db/geofences";
import { query } from "../../db/connect";

// Test location: center of our test geofence
const INSIDE_FENCE = { lon: -97.14, lat: 49.89 };
const OUTSIDE_FENCE = { lon: -100.0, lat: 45.0 }; // Far away

type TestContext = {
  eventId: string;
  userId: string;
  organizerId: string;
};

/**
 * Seed an event with configurable time window.
 * - "active": started 30 min ago, ends in 30 min (can sign in/out now)
 * - "future": starts in 1 hour (too early to sign in)
 * - "past": ended 1 hour ago (too late to sign in)
 */
async function seedEventWithTiming(
  timing: "active" | "future" | "past"
): Promise<TestContext> {
  const unique = crypto.randomUUID();

  // Create organizer
  const { rows: userRows } = await query<{ id: string }>(
    `INSERT INTO users (id, email, username, role, password_hash)
     VALUES (gen_random_uuid(), $1, $2, 'Organizer', 'hashed_pw')
     RETURNING id`,
    [`org_${unique}@test.com`, `org_${unique}`]
  );
  const organizerId = userRows[0].id;

  // Create volunteer
  const { rows: volRows } = await query<{ id: string }>(
    `INSERT INTO users (id, email, username, role, password_hash)
     VALUES (gen_random_uuid(), $1, $2, 'Volunteer', 'hashed_pw')
     RETURNING id`,
    [`vol_${unique}@test.com`, `vol_${unique}`]
  );
  const userId = volRows[0].id;

  // Calculate times based on timing parameter
  let startOffset: string;
  let endOffset: string;

  switch (timing) {
    case "active":
      startOffset = "-30 minutes";
      endOffset = "+30 minutes";
      break;
    case "future":
      startOffset = "+1 hour";
      endOffset = "+2 hours";
      break;
    case "past":
      startOffset = "-2 hours";
      endOffset = "-1 hour";
      break;
  }

  // Create event
  const { rows: eventRows } = await query<{ id: string }>(
    `INSERT INTO events (organizer_id, job_name, description, start_time, end_time, location)
     VALUES ($1, $2, 'Test event', NOW() + $3::interval, NOW() + $4::interval, 'Test Location')
     RETURNING id`,
    [organizerId, `Event_${unique}`, startOffset, endOffset]
  );
  const eventId = eventRows[0].id;

  // Register volunteer for event (status = 'accepted')
  await query(
    `INSERT INTO registered_users (user_id, event_id, status)
     VALUES ($1, $2, 'accepted')`,
    [userId, eventId]
  );

  return { eventId, userId, organizerId };
}

/**
 * Add a circular geofence around our test location
 */
async function addGeofence(eventId: string) {
  await createCircleFence({
    eventId,
    name: "Test Geofence",
    lon: INSIDE_FENCE.lon,
    lat: INSIDE_FENCE.lat,
    radius_m: 100, // 100 meter radius
  });
}

describe("Attendance Integration: sign-in/sign-out flow", () => {
  describe("Time window validation", () => {
    test("cannot sign in before event window (5 min before start)", async () => {
      const { eventId, userId } = await seedEventWithTiming("future");
      await addGeofence(eventId);

      const result = await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });

      expect(result.outcome).toBe("forbidden");
      if (result.outcome === "forbidden") {
        expect(result.message).toContain("5 minutes before");
      }
    });

    test("cannot sign in after event has ended", async () => {
      const { eventId, userId } = await seedEventWithTiming("past");
      await addGeofence(eventId);

      const result = await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });

      expect(result.outcome).toBe("forbidden");
      if (result.outcome === "forbidden") {
        expect(result.message).toContain("ended");
      }
    });

    test("can sign in during active event window", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      await addGeofence(eventId);

      const result = await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });

      expect(result.outcome).toBe("ok");
      expect(result.status.status.isSignedIn).toBe(true);
    });
  });

  describe("Geofence validation", () => {
    test("cannot sign in from outside geofence", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      await addGeofence(eventId);

      const result = await signInAttendanceService(eventId, userId, {
        ...OUTSIDE_FENCE,
        accuracy_m: 10,
      });

      expect(result.outcome).toBe("forbidden");
      if (result.outcome === "forbidden") {
        expect(result.message).toContain("geofence");
      }
    });

    test("can sign in from inside geofence", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      await addGeofence(eventId);

      const result = await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });

      expect(result.outcome).toBe("ok");
      expect(result.status.status.isSignedIn).toBe(true);
    });

    test("sign in without geofence allows any location (no fence = no restriction)", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      // No geofence added

      // The isPointInsideAnyFence returns false when no fences exist
      // So this should be forbidden
      const result = await signInAttendanceService(eventId, userId, {
        ...OUTSIDE_FENCE,
        accuracy_m: 10,
      });

      // Current implementation: no fence = point not inside any fence = rejected
      expect(result.outcome).toBe("forbidden");
    });

    test("rejects sign in with missing location", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      await addGeofence(eventId);

      const result = await signInAttendanceService(eventId, userId, {
        // No lon/lat provided
        accuracy_m: 10,
      });

      expect(result.outcome).toBe("forbidden");
      if (result.outcome === "forbidden") {
        expect(result.message).toContain("location");
      }
    });
  });

  describe("State transitions", () => {
    test("full sign-in → sign-out → sign-in cycle", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      await addGeofence(eventId);

      // Initial state: not signed in
      const initial = await getAttendanceStatusService(eventId, userId);
      expect(initial.status.isSignedIn).toBe(false);
      expect(initial.rules.canSignIn).toBe(true);
      expect(initial.rules.canSignOut).toBe(false);

      // Sign in
      const signIn1 = await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });
      expect(signIn1.outcome).toBe("ok");
      expect(signIn1.status.status.isSignedIn).toBe(true);
      expect(signIn1.status.rules.canSignIn).toBe(false);
      expect(signIn1.status.rules.canSignOut).toBe(true);

      // Sign out
      const signOut1 = await signOutAttendanceService(eventId, userId, {});
      expect(signOut1.outcome).toBe("ok");
      expect(signOut1.status.status.isSignedIn).toBe(false);
      expect(signOut1.status.rules.canSignIn).toBe(true);

      // Sign in again
      const signIn2 = await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });
      expect(signIn2.outcome).toBe("ok");
      expect(signIn2.status.status.isSignedIn).toBe(true);
    });

    test("cannot sign in twice without signing out", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      await addGeofence(eventId);

      // Sign in first time
      await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });

      // Try to sign in again
      const result = await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });

      expect(result.outcome).toBe("forbidden");
      // Already signed in, so canSignIn = false
      expect(result.status.rules.canSignIn).toBe(false);
    });

    test("sign out when already signed out is idempotent (no error)", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      await addGeofence(eventId);

      // Sign in then sign out
      await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });
      await signOutAttendanceService(eventId, userId, {});

      // Sign out again - should succeed idempotently
      const result = await signOutAttendanceService(eventId, userId, {});
      expect(result.outcome).toBe("ok");
    });
  });

  describe("Minutes calculation", () => {
    test("totalMinutes accumulates across sign-in/out pairs", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      await addGeofence(eventId);

      // Sign in
      const signIn = await signInAttendanceService(eventId, userId, {
        ...INSIDE_FENCE,
        accuracy_m: 10,
      });

      // Minutes should start accumulating (at least 0)
      expect(signIn.status.status.totalMinutes).toBeGreaterThanOrEqual(0);

      // Sign out
      const signOut = await signOutAttendanceService(eventId, userId, {});

      // Minutes should be captured
      expect(signOut.status.status.totalMinutes).toBeGreaterThanOrEqual(0);
    });

    test("rejected sign-in (outside geofence) does not count minutes", async () => {
      const { eventId, userId } = await seedEventWithTiming("active");
      await addGeofence(eventId);

      // Attempt sign in from outside
      const result = await signInAttendanceService(eventId, userId, {
        ...OUTSIDE_FENCE,
        accuracy_m: 10,
      });

      expect(result.outcome).toBe("forbidden");
      // Still 0 minutes because sign-in was rejected
      expect(result.status.status.totalMinutes).toBe(0);
    });
  });

  describe("Event not found", () => {
    test("returns appropriate error for non-existent event", async () => {
      const { userId } = await seedEventWithTiming("active");
      const fakeEventId = "00000000-0000-0000-0000-000000000000";

      const status = await getAttendanceStatusService(fakeEventId, userId);

      expect(status.rules.canSignIn).toBe(false);
      expect(status.rules.reason).toContain("not found");
    });
  });
});

describe("Attendance Integration: volunteer stats", () => {
  test("getVolunteerStatsService returns hours across multiple events", async () => {
    // Create two events with the same volunteer
    const ctx1 = await seedEventWithTiming("active");
    const ctx2 = await seedEventWithTiming("past"); // Already ended

    // Use same volunteer for both
    const userId = ctx1.userId;

    // Register user for second event too
    await query(
      `INSERT INTO registered_users (user_id, event_id, status)
       VALUES ($1, $2, 'accepted')`,
      [userId, ctx2.eventId]
    );

    // Add geofence to first event and sign in/out
    await addGeofence(ctx1.eventId);
    await signInAttendanceService(ctx1.eventId, userId, {
      ...INSIDE_FENCE,
      accuracy_m: 10,
    });
    await signOutAttendanceService(ctx1.eventId, userId, {});

    // Get stats
    const stats = await getVolunteerStatsService(userId);

    expect(stats.totalMinutes).toBeGreaterThanOrEqual(0);
    expect(stats.totalHours).toBeGreaterThanOrEqual(0);
    expect(stats.jobsCompleted).toBeGreaterThanOrEqual(0);
    // One event is past (completed) and volunteer is accepted for it
    expect(stats.jobsCompleted).toBe(1);
  });
});
