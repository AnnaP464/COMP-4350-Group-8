// tests/services/attendanceService.test.ts
// Unit tests for attendance-related service functions

import * as eventsService from "../../services/eventsService";
import * as events from "../../db/events";
import { attendanceRepo } from "../../db/attendance";
import * as attendanceDb from "../../db/attendance";
import { geofences } from "../../db/geofences";

// Mock all database modules
jest.mock("../../db/events");
jest.mock("../../db/attendance");
jest.mock("../../db/geofences");

const mockEvents = events as jest.Mocked<typeof events>;
const mockAttendanceRepo = attendanceRepo as jest.Mocked<typeof attendanceRepo>;
const mockGeofences = geofences as jest.Mocked<typeof geofences>;
const mockAttendanceDb = attendanceDb as jest.Mocked<typeof attendanceDb>;

describe("AttendanceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getAttendanceStatusService", () => {
    test("returns 'Event not found' when event doesn't exist", async () => {
      mockEvents.getEventById.mockResolvedValue(null);

      const result = await eventsService.getAttendanceStatusService("evt-1", "user-1");

      expect(result).toEqual({
        status: { isSignedIn: false, totalMinutes: 0 },
        rules: { canSignIn: false, canSignOut: false, reason: "Event not found" },
      });
    });

    test("returns canSignIn=true when within sign-in window and not signed in", async () => {
      const now = new Date("2025-01-15T10:00:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z", // starts now
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([]);

      const result = await eventsService.getAttendanceStatusService("evt-1", "user-1");

      expect(result.status.isSignedIn).toBe(false);
      expect(result.rules.canSignIn).toBe(true);
      expect(result.rules.canSignOut).toBe(false);
    });

    test("returns canSignIn=false with reason when event hasn't started yet", async () => {
      const now = new Date("2025-01-15T08:00:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z", // starts in 2 hours
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([]);

      const result = await eventsService.getAttendanceStatusService("evt-1", "user-1");

      expect(result.rules.canSignIn).toBe(false);
      expect(result.rules.reason).toContain("5 minutes before");
    });

    test("returns canSignIn=false when event has ended", async () => {
      const now = new Date("2025-01-15T14:00:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z", // ended 2 hours ago
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([]);

      const result = await eventsService.getAttendanceStatusService("evt-1", "user-1");

      expect(result.rules.canSignIn).toBe(false);
      expect(result.rules.reason).toBe("This event has ended");
    });

    test("returns canSignOut=true when user is currently signed in", async () => {
      const now = new Date("2025-01-15T11:00:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([
        {
          id: "action-1",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_in",
          at_time: "2025-01-15T10:30:00Z",
          accepted: true,
        },
      ]);

      const result = await eventsService.getAttendanceStatusService("evt-1", "user-1");

      expect(result.status.isSignedIn).toBe(true);
      expect(result.rules.canSignIn).toBe(false);
      expect(result.rules.canSignOut).toBe(true);
    });

    test("computes totalMinutes correctly from sign_in/sign_out pairs", async () => {
      const now = new Date("2025-01-15T11:30:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T14:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([
        {
          id: "action-1",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_in",
          at_time: "2025-01-15T10:00:00Z",
          accepted: true,
        },
        {
          id: "action-2",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_out",
          at_time: "2025-01-15T11:00:00Z", // 60 minutes
          accepted: true,
        },
      ]);

      const result = await eventsService.getAttendanceStatusService("evt-1", "user-1");

      expect(result.status.totalMinutes).toBe(60);
      expect(result.status.isSignedIn).toBe(false);
    });

    test("includes open interval in totalMinutes when still signed in", async () => {
      const now = new Date("2025-01-15T11:30:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T14:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([
        {
          id: "action-1",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_in",
          at_time: "2025-01-15T11:00:00Z", // signed in 30 min ago
          accepted: true,
        },
      ]);

      const result = await eventsService.getAttendanceStatusService("evt-1", "user-1");

      expect(result.status.totalMinutes).toBe(30);
      expect(result.status.isSignedIn).toBe(true);
    });
  });

  describe("signInAttendanceService", () => {
    test("returns forbidden when canSignIn is false", async () => {
      const now = new Date("2025-01-15T08:00:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([]);

      const result = await eventsService.signInAttendanceService("evt-1", "user-1", {
        lon: -97.0,
        lat: 49.0,
      });

      expect(result.outcome).toBe("forbidden");
      expect((result as any).message).toContain("5 minutes before");
    });

    test("returns forbidden when location is missing", async () => {
      const now = new Date("2025-01-15T10:30:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([]);

      const result = await eventsService.signInAttendanceService("evt-1", "user-1", {});

      expect(result.outcome).toBe("forbidden");
      expect((result as any).message).toBe("Missing or invalid location for sign-in.");
    });

    test("returns forbidden when outside geofence", async () => {
      const now = new Date("2025-01-15T10:30:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([]);
      mockGeofences.isPointInsideAnyFence.mockResolvedValue(false);
      mockAttendanceRepo.insertAction.mockResolvedValue({} as any);

      const result = await eventsService.signInAttendanceService("evt-1", "user-1", {
        lon: -97.0,
        lat: 49.0,
      });

      expect(result.outcome).toBe("forbidden");
      expect((result as any).message).toBe("You must be within the event geofence to sign in.");
      // Should log the rejected attempt
      expect(mockAttendanceRepo.insertAction).toHaveBeenCalledWith({
        eventId: "evt-1",
        userId: "user-1",
        action: "sign_in",
        accepted: false,
        accuracy_m: null,
      });
    });

    test("returns ok when inside geofence and within time window", async () => {
      const now = new Date("2025-01-15T10:30:00Z");
      jest.setSystemTime(now);

      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions
        .mockResolvedValueOnce([]) // first call for canSignIn check
        .mockResolvedValueOnce([  // second call after sign-in
          {
            id: "action-1",
            event_id: "evt-1",
            user_id: "user-1",
            action: "sign_in",
            at_time: "2025-01-15T10:30:00Z",
            accepted: true,
          },
        ]);
      mockGeofences.isPointInsideAnyFence.mockResolvedValue(true);
      mockAttendanceRepo.insertAction.mockResolvedValue({} as any);

      const result = await eventsService.signInAttendanceService("evt-1", "user-1", {
        lon: -97.0,
        lat: 49.0,
        accuracy_m: 10,
      });

      expect(result.outcome).toBe("ok");
      expect(mockAttendanceRepo.insertAction).toHaveBeenCalledWith({
        eventId: "evt-1",
        userId: "user-1",
        action: "sign_in",
        accepted: true,
        accuracy_m: 10,
      });
    });
  });

  describe("signOutAttendanceService", () => {
    test("returns ok idempotently when already signed out", async () => {
      const now = new Date("2025-01-15T11:00:00Z");
      jest.setSystemTime(now);

      mockAttendanceRepo.getLastAcceptedAction.mockResolvedValue(null);
      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([]);

      const result = await eventsService.signOutAttendanceService("evt-1", "user-1", {});

      expect(result.outcome).toBe("ok");
      // Should NOT insert a new action
      expect(mockAttendanceRepo.insertAction).not.toHaveBeenCalled();
    });

    test("returns ok and records sign-out when currently signed in", async () => {
      const now = new Date("2025-01-15T11:00:00Z");
      jest.setSystemTime(now);

      mockAttendanceRepo.getLastAcceptedAction.mockResolvedValue({
        id: "action-1",
        event_id: "evt-1",
        user_id: "user-1",
        action: "sign_in",
        at_time: "2025-01-15T10:30:00Z",
        accepted: true,
      });
      mockEvents.getEventById.mockResolvedValue({
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      });
      mockAttendanceRepo.listAcceptedActions.mockResolvedValue([
        {
          id: "action-1",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_in",
          at_time: "2025-01-15T10:30:00Z",
          accepted: true,
        },
      ]);
      mockAttendanceRepo.insertAction.mockResolvedValue({} as any);

      const result = await eventsService.signOutAttendanceService("evt-1", "user-1", {});

      expect(result.outcome).toBe("ok");
      expect(mockAttendanceRepo.insertAction).toHaveBeenCalledWith({
        eventId: "evt-1",
        userId: "user-1",
        action: "sign_out",
        accepted: true,
        accuracy_m: null,
      });
    });
  });

  describe("getVolunteerStatsService", () => {
    test("returns zero stats when user has no attendance records", async () => {
      mockAttendanceDb.listAllAcceptedActionsForUser.mockResolvedValue([]);
      mockAttendanceDb.countCompletedEventsForUser.mockResolvedValue(0);
      mockAttendanceDb.countUpcomingEventsForUser.mockResolvedValue(0);

      const result = await eventsService.getVolunteerStatsService("user-1");

      expect(result).toEqual({
        totalMinutes: 0,
        totalHours: 0,
        jobsCompleted: 0,
        upcomingJobs: 0,
      });
    });

    test("computes totalMinutes correctly across multiple events", async () => {
      const now = new Date("2025-01-20T12:00:00Z");
      jest.setSystemTime(now);

      mockAttendanceDb.listAllAcceptedActionsForUser.mockResolvedValue([
        // Event 1: 60 minutes
        {
          id: "a1",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_in",
          at_time: "2025-01-15T10:00:00Z",
          accepted: true,
          eventEndTime: "2025-01-15T14:00:00Z",
        },
        {
          id: "a2",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_out",
          at_time: "2025-01-15T11:00:00Z",
          accepted: true,
          eventEndTime: "2025-01-15T14:00:00Z",
        },
        // Event 2: 30 minutes
        {
          id: "a3",
          event_id: "evt-2",
          user_id: "user-1",
          action: "sign_in",
          at_time: "2025-01-16T09:00:00Z",
          accepted: true,
          eventEndTime: "2025-01-16T12:00:00Z",
        },
        {
          id: "a4",
          event_id: "evt-2",
          user_id: "user-1",
          action: "sign_out",
          at_time: "2025-01-16T09:30:00Z",
          accepted: true,
          eventEndTime: "2025-01-16T12:00:00Z",
        },
      ]);
      mockAttendanceDb.countCompletedEventsForUser.mockResolvedValue(2);
      mockAttendanceDb.countUpcomingEventsForUser.mockResolvedValue(1);

      const result = await eventsService.getVolunteerStatsService("user-1");

      expect(result.totalMinutes).toBe(90); // 60 + 30
      expect(result.totalHours).toBe(1.5); // 90/60 rounded to 1 decimal
      expect(result.jobsCompleted).toBe(2);
      expect(result.upcomingJobs).toBe(1);
    });

    test("caps minutes at event end time for past events", async () => {
      const now = new Date("2025-01-20T12:00:00Z");
      jest.setSystemTime(now);

      // User signed in but never signed out - event has ended
      mockAttendanceDb.listAllAcceptedActionsForUser.mockResolvedValue([
        {
          id: "a1",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_in",
          at_time: "2025-01-15T10:00:00Z",
          accepted: true,
          eventEndTime: "2025-01-15T11:00:00Z", // Event ended 1 hour after sign-in
        },
      ]);
      mockAttendanceDb.countCompletedEventsForUser.mockResolvedValue(1);
      mockAttendanceDb.countUpcomingEventsForUser.mockResolvedValue(0);

      const result = await eventsService.getVolunteerStatsService("user-1");

      // Should be capped at 60 minutes (event end), not counting to "now"
      expect(result.totalMinutes).toBe(60);
    });
  });
});
