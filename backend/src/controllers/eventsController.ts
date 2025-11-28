import { Request, Response, NextFunction } from "express";
import * as eventService from "../services/eventsService";
import * as events from "../db/events";
import { attendanceRepo } from "../db/attendance";
import type { AttendanceRow } from "../contracts/attendance.contracts";


// POST /v1/events (auth required)
export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try
  { 
    console.log("[controller] createEvent body:", req.body, "user:", req.user?.id);
    const organizerId = req.user?.id; // set by requireAuth middleware from access token
    if(!organizerId) return res.status(401).json({message: "Unauthorized"});

    const {jobName, description, startTime, endTime, location} = req.body ?? {};
    if(!jobName || !description || !location || !startTime || !endTime)
      return res.status(400).json({message: "Missing required fields"});

    const ev = await events.createEvent({
      organizerId, 
      jobName: String (jobName),
      description: String(description),
      startTime: String(startTime),
      endTime: String(endTime),
      location: String(location),
    });
    console.log("[controller] createEvent inserted:", ev?.id);

    return res.status(201).json(ev);
  } 
  catch (err){
    next(err);
  }
}

// GET /v1/events
//(?mine=1 to filter to current organizer)
//(?registered=1 to filter to events registered by current volunteer)
export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const mine = String(req.query.mine || "").toLowerCase() === "1";
    const registered = String(req.query.registered || "").toLowerCase() === "1";

    //organizer events
    if (mine) 
    {
      const organizerId = req.user?.id;
      if (!organizerId) 
        return res.status(401).json({ message: "Unauthorized" });
      const rows = await eventService.listMyEventsService(organizerId);
      return res.json(rows);
    }
    //volunteer registered 
    else if(registered) {
      const userId = req.user?.id;
      if (!userId) 
        return res.status(401).json({ message: "Unauthorized" });
      const rows = await eventService.listRegisteredEventsService(userId);
      return res.json(rows);
    }

    //else list all events
    else{
      const rows = await events.listAll();
      return res.json(rows);
    }
  } catch (err) {
    next(err);
  }
}

// POST /v1/events/apply (auth required)
// OLD NAME: registerUserForEvent
export async function applyForEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;        // from auth
    const { eventId } = req.body; 

    // //ensure evenId != null AND is a string
    // if (!eventId || typeof eventId !== "string") 
    //   return res.status(400).json({ message: "eventId is required and must be a string" });

    const { outcome, row } = await eventService.applyForEventService(userId, eventId);

    switch (outcome) {
      case 'inserted':
        return res.status(201).json(row); // { userID, eventID, status, appliedAt }

      case 'event_not_found':
        return res.status(404).json({ message: 'Event not found' });

      case 'already_applied':
        return res.status(409).json({ message: 'You have already applied for this event' });

      case 'already_accepted':
        return res.status(409).json({ message: 'You are already accepted for this event' });

      case 'rejected':
        // choose 403 (forbidden to re-apply) or 409 (conflict) 
        return res.status(403).json({ message: 'Your application was rejected; you cannot re-apply to this event' });

      default:
        return res.status(500).json({ message: 'Server error' });
    }
  } catch (err) {
    next(err);
  }
}


// DELETE /v1/events/withdraw (auth required)
// OLD NAME: deregisterUserForEvent
export async function withdrawApplication(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("[controller] withdrawApplication body:", req.body, "user:", req.user?.id);
    const volunteerId = req.user?.id;
    if (!volunteerId) return res.status(401).json({ message: "Unauthorized" });

    const { eventId } = req.body ?? {};
    if (!eventId) return res.status(400).json({ message: "Missing event ID in request" });

    const row = await eventService.withdrawApplicationService(volunteerId, eventId);
    if (!row) return res.status(409).json({ message: "No application/registration to withdraw" });

    return res.status(200).json({ message: "Withdrawn successfully" });
  } catch (err) {
    next(err);
  }
}
  
// GET /v1/users/me/applications
//list my applications with status
export async function listMyApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const rows = await eventService.listMyApplicationsService(userId);
    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /v1/events/:eventId/applicants (organizer)
export async function listApplicants(req: Request, res: Response, next: NextFunction) {
  try {
    const organizerId = req.user?.id;
    if (!organizerId) return res.status(401).json({ message: "Unauthorized" });

    const { eventId } = req.params;
    if (!eventId) return res.status(400).json({ message: "Missing eventId" });

    // (Optional) Verify organizer owns the event here if you have a helper/middleware
    const rows = await eventService.listApplicantsService(eventId);
    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /v1/events/:eventId/accepted (organizer)
export async function listAccepted(req: Request, res: Response, next: NextFunction) {
  try {
    const organizerId = req.user?.id;
    if (!organizerId) return res.status(401).json({ message: "Unauthorized" });

    const { eventId } = req.params;
    if (!eventId) return res.status(400).json({ message: "Missing eventId" });

    const rows = await eventService.listAcceptedService(eventId);
    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /v1/events/:eventId/applicants/:userId/accept (organizer)
//does collision check here : if user is accepted for a different event for overlapping time
export async function acceptApplicant(req: Request, res: Response, next: NextFunction) {
  try {
    const organizerId = req.user?.id;
    if (!organizerId) return res.status(401).json({ message: "Unauthorized" });

    const { eventId, userId } = req.params;
    if (!eventId || !userId) return res.status(400).json({ message: "Missing eventId or userId" });


    try {
      const row = await eventService.acceptApplicantService(organizerId, userId, eventId);
      if (!row) return res.status(404).json({ message: "Application not found" });
      return res.status(200).json({ message: "Accepted", signup: row });
    } catch (e) {
      // thrown when userHasAcceptedCollision returns true
      return res.status(409).json({ message: "User has a conflicting accepted event" });
    }
  } catch (err) {
    next(err);
  }
}


// PATCH /v1/events/:eventId/applicants/:userId/reject (organizer)
export async function rejectApplicant(req: Request, res: Response, next: NextFunction) {
  try {
    const organizerId = req.user?.id;
    if (!organizerId) return res.status(401).json({ message: "Unauthorized" });

    const { eventId, userId } = req.params;
    if (!eventId || !userId) return res.status(400).json({ message: "Missing eventId or userId" });

    // Optionally verify ownership of event here

    const row = await eventService.rejectApplicantService(organizerId, userId, eventId);
    if (!row) return res.status(404).json({ message: "Application not found" });
    return res.status(200).json({ message: "Rejected", signup: row });
  } catch (err) {
    next(err);
  }
}


// ---------------------------------------------------------------------------
// Event attendance: status + sign-in / sign-out
// ---------------------------------------------------------------------------


function computeTotalMinutesFromActions(
  actions: AttendanceRow[],
  now: Date
): number {
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


type AttendanceStatusView = {
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

// Helper: get authed user from req.user (set by requireAuth)
function getAuthedUser(req: Request): { id: string; role?: string } | null {
  const u = (req as any).user;
  if (!u || !u.id) return null;
  return { id: String(u.id), role: (u as any).role };
}

/**
 * Build the AttendanceStatusView for a given event/user.
 * Right now:
 *  - isSignedIn = whether the last accepted action is "sign_in"
 *  - totalMinutes = 0 (we're not computing it yet)
 *  - rules = simple toggle: if signed in → canSignOut, else → canSignIn
 */
async function buildAttendanceStatus(
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
  const end   = new Date(event.endTime);

  // allow sign-in from 5 min before start → end
  const SIGNIN_EARLY_MINUTES = 5;
  const startWindow = new Date(start.getTime() - SIGNIN_EARLY_MINUTES * 60_000);
  const withinSignInWindow = now >= startWindow && now <= end;

  // 2) All accepted actions
  const actions = await attendanceRepo.listAcceptedActions({ eventId, userId });

  // Determine if user is currently signed in (last action is sign_in)
  const last = actions[actions.length - 1];
  const isSignedIn = !!last && last.action === "sign_in";

  // 3) Compute total minutes from all in/out pairs
  const totalMinutes = computeTotalMinutesFromActions(actions, now);

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



// GET /v1/events/:eventId/attendance/status
export async function getAttendanceStatus(req: Request, res: Response) {
  try {
    const { eventId } = req.params as { eventId: string };
    const user = getAuthedUser(req);
    if (!user) 
      return res.status(401).json({ message: "Unauthorized" });

    const status = await buildAttendanceStatus(eventId, user.id);
    return res.json(status);
  } catch (err) {
    console.error("getAttendanceStatus error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /v1/events/:eventId/attendance/sign-in
export async function signInAttendance(req: Request, res: Response) {
  try {
    const { eventId } = req.params as { eventId: string };
    const user = getAuthedUser(req);
    if (!user) 
      return res.status(401).json({ message: "Unauthorized" });

    const body = req.body as {
      lon?: number;
      lat?: number;
      accuracy_m?: number;
    };

    // 1) Check status & rules first
    const statusBefore = await buildAttendanceStatus(eventId, user.id);
    if (!statusBefore.rules.canSignIn) {
      return res.status(403).json({
        message: statusBefore.rules.reason ?? "You cannot sign in right now.",
        status: statusBefore,
      });
    }

    // 2) Record sign-in
    // Later we'll enforce time window + geofence here.
    await attendanceRepo.insertAction({
      eventId,
      userId: user.id,
      action: "sign_in",
      accepted: true,// later: enforce geofence + time windows
      accuracy_m: body.accuracy_m ?? null,
    });

    // 3) Return updated status
    const status = await buildAttendanceStatus(eventId, user.id);
    res.status(200).json(status);

  } catch (err) {
    console.error("signInAttendance error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /v1/events/:eventId/attendance/sign-out
export async function signOutAttendance(req: Request, res: Response) {
  try {
    const { eventId } = req.params as { eventId: string };
    const user = getAuthedUser(req);
    if (!user)
        return res.status(401).json({ message: "Unauthorized" });

    const body = req.body as {
      lon?: number;
      lat?: number;
      accuracy_m?: number;
    };

    // 1) Check status *before* inserting
    const statusBefore = await buildAttendanceStatus(eventId, user.id);
    if (!statusBefore.rules.canSignOut) {
      return res.status(403).json({
        message:
          statusBefore.rules.reason ??
          "You are not currently signed in to this event.",
        status: statusBefore,
      });
    }

    // 2) Record sign-out    
    await attendanceRepo.insertAction({
      eventId,
      userId: user.id,
      action: "sign_out",
      accepted: true,
      accuracy_m: body.accuracy_m ?? null,
    });

    // 3) Return updated status
    const status = await buildAttendanceStatus(eventId, user.id);
    return res.status(200).json(status);
  } catch (err) {
    console.error("signOutAttendance error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
