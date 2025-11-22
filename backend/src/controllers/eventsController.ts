import { Request, Response, NextFunction } from "express";
import * as eventService from "../services/eventsService";
import * as events from "../db/events";
import { listMyEventsService } from "../services/eventsService";

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
