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

// POST /v1/events/register (auth required)
export async function registerUserForEvent(req: Request, res: Response, next: NextFunction) {
  try
  {
    //check for valid user here
    console.log("[controller] registerUserForEvent body:", req.body, "user:", req.user?.id);
    const volunteerId = req.user?.id; // set by requireAuth middleware from access token
    if(!volunteerId) return res.status(401).json({message: "Unauthorized"});

    const {eventId} = req.body ?? {};
    if(!eventId)
      return res.status(400).json({message: "Missing event ID in request"});
    
    try{
      const response = await eventService.registerUserForEventService(volunteerId, eventId);
      if(!response)//make sure the row is recieved back
        return res.status(409).json({message: "User is already registered for event"});
    } catch (error){
      return res.status(409).json({message:"User is already registered for an event at this time"});
    }
    return res.status(201).json({message: "Registered Successfully"});
  } 
  catch (err){
    next(err);
  }
}

// DELETE /v1/events/deregister (auth required)
export async function deregisterUserForEvent(req: Request, res: Response, next: NextFunction) {
  try
  {
    //check for valid user here
    console.log("[controller] deregisterUserForEvent body:", req.body, "user:", req.user?.id);
    const volunteerId = req.user?.id; // set by requireAuth middleware from access token
    if(!volunteerId) return res.status(401).json({message: "Unauthorized"});

    const {eventId} = req.body ?? {};
    if(!eventId)
      return res.status(400).json({message: "Missing event ID in request"});
  
    const response = await eventService.deregisterUserForEventService(volunteerId, eventId);
    if(!response)//make sure the row is recieved back
      return res.status(409).json({message: "User is already deregistered for event"});

    return res.status(201).json({message: "Deregistered Successfully"});
  } 
  catch (err){
    next(err);
  }
}



