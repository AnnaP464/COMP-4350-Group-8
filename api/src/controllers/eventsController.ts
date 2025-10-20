import { Request, Response, NextFunction } from "express";
import * as svc from "../services/eventsService";
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
export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const mine = String(req.query.mine || "").toLowerCase() === "1";
    if (mine) 
    {
      const organizerId = req.user?.id;
      if (!organizerId) 
        return res.status(401).json({ message: "Unauthorized" });
      const rows = await svc.listMyEventsService(organizerId);
      return res.json(rows);
    }
    else{
      const rows = await events.listAll();
      return res.json(rows);
    }
  } catch (err) {
    next(err);
  }
}

