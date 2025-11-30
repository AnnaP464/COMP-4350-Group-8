// import * as events from "../db/events";

// export async function createEventService(args: {
//   organizerId: string;
//   jobName: string;
//   description: string;
//   startTime: string; // ISO
//   endTime: string;   // ISO
//   location: string;
// }) {
//   return events.createEvent(args);
// }

// // Volunteer feed
// export async function listEventsService() {
//   return events.listAll();
// }

// //Organizer feed (own events)
// export async function listMyEventsService(organizerId: string) {
//   return events.listByOrganizer(organizerId);
// }

// // export async function registerUserForEventService(volunteerId: string, eventId: string){

// //   //first check that the event is not conflicting with the events the user is already registered for
// //   //get the list of events the user is registered for
// //   //get their times and check that all their times are not overlapping

// //   const conflictingEvents = await events.listCollisions(volunteerId, eventId);
// //   if(conflictingEvents.length != 0){
// //     throw new Error("There are conflicting events");
// //   }
  
// //   return events.registerUserForEvent(volunteerId, eventId);// will return just one row of the event & user ids 
// // }


// /** VOLUNTEER: list events where I’m accepted (registered) */
// export async function listRegisteredEventsService(userId: string) {
//   return events.listRegisteredEventsByUser(userId);
// }

// /** VOLUNTEER: apply for an event (idempotent sets status='applied') */
// export async function applyForEventService(volunteerId: string, eventId: string) {
//   // No collision check here — volunteers can apply to overlapping events
//   return events.registerUserForEvent(volunteerId, eventId);
// }

// /** VOLUNTEER: withdraw application (or deregister) */
// export async function withdrawApplicationService(volunteerId: string, eventId: string) {
//   // If you want to “soft” withdraw instead of delete, change the DB fn to update status='withdrawn'
//   return events.deregisterUserForEvent(volunteerId, eventId);
// }

// /** VOLUNTEER: list my applications with status */
// export async function listMyApplicationsService(userId: string) {
//   return events.listMyApplications(userId);
// }



// /** ORGANIZER: list applicants (status='applied') for an event */
// export async function listApplicantsService(eventId: string) {
//   return events.listApplicants(eventId);
// }

// /** ORGANIZER: list accepted (status='accepted') for an event */
// export async function listAcceptedService(eventId: string) {
//   return events.listAccepted(eventId);
// }

// /** ORGANIZER: accept an applicant (does collision check here) */
// export async function acceptApplicantService(organizerId: string, userId: string, eventId: string) {
//   // Only block if there’s a time overlap with the user’s other *accepted* events
//   const hasConflict = await events.userHasAcceptedCollision(userId, eventId);
//   if (hasConflict) {
//     throw new Error("User has a conflicting accepted event");
//   }
//   return events.acceptApplicant(organizerId, userId, eventId);
// }

// /** ORGANIZER: reject an applicant */
// export async function rejectApplicantService(organizerId: string, userId: string, eventId: string) {
//   return events.rejectApplicant(organizerId, userId, eventId);
// }

// src/services/eventsService.ts
import * as events from "../db/events";
import { attendanceRepo } from "../db/attendance";
import type { AttendanceRow } from "../contracts/attendance.contracts";

// allow sign-in from 5 min before start → end
const SIGNIN_EARLY_MINUTES = 5;

/* ------------------------------------------------------------------
   Existing event / application services
-------------------------------------------------------------------*/

export async function createEventService(args: {
  organizerId: string;
  jobName: string;
  description: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  location: string;
}) {
  return events.createEvent(args);
}

// Volunteer feed
export async function listEventsService() {
  return events.listAll();
}

// Organizer feed (own events)
export async function listMyEventsService(organizerId: string) {
  return events.listByOrganizer(organizerId);
}

/** VOLUNTEER: list events where I’m accepted (registered) */
export async function listRegisteredEventsService(userId: string) {
  return events.listRegisteredEventsByUser(userId);
}

/** VOLUNTEER: apply for an event (idempotent sets status='applied') */
export async function applyForEventService(volunteerId: string, eventId: string) {
  // No collision check here — volunteers can apply to overlapping events
  return events.registerUserForEvent(volunteerId, eventId);
}

/** VOLUNTEER: withdraw application (or deregister) */
export async function withdrawApplicationService(volunteerId: string, eventId: string) {
  return events.deregisterUserForEvent(volunteerId, eventId);
}

/** VOLUNTEER: list my applications with status */
export async function listMyApplicationsService(userId: string) {
  return events.listMyApplications(userId);
}

/** ORGANIZER: list applicants (status='applied') for an event */
export async function listApplicantsService(eventId: string) {
  return events.listApplicants(eventId);
}

/** ORGANIZER: list accepted (status='accepted') for an event */
export async function listAcceptedService(eventId: string) {
  return events.listAccepted(eventId);
}

/** ORGANIZER: accept an applicant (does collision check here) */
export async function acceptApplicantService(
  organizerId: string,
  userId: string,
  eventId: string
) {
  // Only block if there’s a time overlap with the user’s other *accepted* events
  const hasConflict = await events.userHasAcceptedCollision(userId, eventId);
  if (hasConflict) {
    throw new Error("User has a conflicting accepted event");
  }
  return events.acceptApplicant(organizerId, userId, eventId);
}

/** ORGANIZER: reject an applicant */
export async function rejectApplicantService(
  organizerId: string,
  userId: string,
  eventId: string
) {
  return events.rejectApplicant(organizerId, userId, eventId);
}

/* ------------------------------------------------------------------
   Attendance helpers
-------------------------------------------------------------------*/

export type AttendanceStatusView = {
  status: {
    isSignedIn: boolean;
    totalMinutes: number;
  };
  rules: {
    canSignIn: boolean;
    canSignOut: boolean;
    reason?: string;
  };
};

// Computes minutes from actions (sign_in / sign_out pairs)
function computeTotalMinutesFromActions(actions: AttendanceRow[], now: Date): number {
  let totalMs = 0;
  let lastSignIn: Date | null = null;

  for (const row of actions) {
    const t = new Date(row.at_time); // PG timestamptz -> string -> Date

    if (row.action === "sign_in") {
      // Start a new interval
      lastSignIn = t;
    } else if (row.action === "sign_out" && lastSignIn) {
      // Close current interval
      totalMs += t.getTime() - lastSignIn.getTime();
      lastSignIn = null;
    }
  }

  // If still signed in at "now", count that open interval too
  if (lastSignIn) {
    totalMs += now.getTime() - lastSignIn.getTime();
  }

  return Math.floor(totalMs / 60_000); // minutes
}

/**
 * Build the AttendanceStatusView for a given event/user.
 * Behaviour is identical to the old buildAttendanceStatus helper:
 *  - If event missing: returns "Event not found" in rules.reason
 *  - Uses SIGNIN_EARLY_MINUTES window to decide canSignIn/canSignOut
 */
export async function getAttendanceStatusService(
  eventId: string,
  userId: string
): Promise<AttendanceStatusView> {
  // 1) Load event for time window
  const event = await events.getEventById(eventId);
  if (!event) {
    return {
      status: {
        isSignedIn: false,
        totalMinutes: 0,
      },
      rules: {
        canSignIn: false,
        canSignOut: false,
        reason: "Event not found",
      },
    };
  }

  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  //Clamp "now" so minutes never grow beyond the event end time
  const effectiveNow = now > end ? end : now;

  const startWindow = new Date(start.getTime() - SIGNIN_EARLY_MINUTES * 60_000);
  const withinSignInWindow = now >= startWindow && now <= end;

  // 2) All accepted actions
  const actions = await attendanceRepo.listAcceptedActions({ eventId, userId });

  // Determine if user is currently signed in (last action is sign_in)
  const last = actions[actions.length - 1];
  let isSignedIn = !!last && last.action === "sign_in";

  // 3) Compute total minutes from all in/out pairs
  //    but only up to effectiveNow (never past event end)
  const totalMinutes = computeTotalMinutesFromActions(actions, effectiveNow);

  // // If we are at/after the event end time, treat the user as signed out
  // if (effectiveNow.getTime() >= end.getTime()) {
  //   isSignedIn = false;
  // }

  // 4) Rules & reason
  let canSignIn = false;
  let canSignOut = false;
  let reason: string | undefined;

  if (isSignedIn) {
    // already in → only allow sign-out
    canSignOut = true;
  } else {
    if (!withinSignInWindow) {
      if (now < startWindow) {
        reason = `You can only sign in within ${SIGNIN_EARLY_MINUTES} minutes before the event starts.`;
      } else {
        reason = "This event has ended";
      }
    } else {
      canSignIn = true;
    }
  }

  return {
    status: {
      isSignedIn,
      totalMinutes,
    },
    rules: {
      canSignIn,
      canSignOut,
      ...(reason ? { reason } : {}),
    },
  };
}

/* ------------------------------------------------------------------
   Attendance: sign-in / sign-out service functions
   They mirror applyForEventService style: return an outcome object.
-------------------------------------------------------------------*/

type SignBody = {
  accuracy_m?: number | null;
};

export type SignInResult =
  | { outcome: "ok"; status: AttendanceStatusView }
  | { outcome: "forbidden"; message: string; status: AttendanceStatusView };

export async function signInAttendanceService(
  eventId: string,
  userId: string,
  body: SignBody
): Promise<SignInResult> {
  // 1) Check status & rules first
  const statusBefore = await getAttendanceStatusService(eventId, userId);
  if (!statusBefore.rules.canSignIn) {
    return {
      outcome: "forbidden",
      message: statusBefore.rules.reason ?? "You cannot sign in right now.",
      status: statusBefore,
    };
  }

  // 2) Record sign-in (same as old controller)
  await attendanceRepo.insertAction({
    eventId,
    userId,
    action: "sign_in",
    accepted: true, // later: enforce geofence + time windows
    accuracy_m: body.accuracy_m ?? null,
  });

  // 3) Return updated status
  const status = await getAttendanceStatusService(eventId, userId);
  return { outcome: "ok", status };
}

export type SignOutResult =
  | { outcome: "ok"; status: AttendanceStatusView }
  | { outcome: "forbidden"; message: string; status: AttendanceStatusView };

export async function signOutAttendanceService(
  eventId: string,
  userId: string,
  body: SignBody
): Promise<SignOutResult> {
  // Check the actual last accepted action from DB
  const last = await attendanceRepo.getLastAcceptedAction({ eventId, userId });

  // Always compute the "official" status we want to return
  const statusBefore = await getAttendanceStatusService(eventId, userId);

  // Already signed out: treat as idempotent success
  // Return: Do nothing
  if (!last || last.action === "sign_out") {
    return {
      outcome: "ok",
      status: statusBefore,
    };
  }

  // At this point we know the last action is sign_in.
  // If rules say we cannot sign out, return forbidden (manual misuse, etc.).
  if (!statusBefore.rules.canSignOut) {
    return {
      outcome: "forbidden",
      message:
        statusBefore.rules.reason ??
        "You are not currently signed in to this event.",
      status: statusBefore,
    };
  }

  // 2) Record sign-out exactly once
  await attendanceRepo.insertAction({
    eventId,
    userId,
    action: "sign_out",
    accepted: true,
    accuracy_m: body.accuracy_m ?? null,
  });

  // 3) Return updated status
  const status = await getAttendanceStatusService(eventId, userId);
  return { outcome: "ok", status };
}
