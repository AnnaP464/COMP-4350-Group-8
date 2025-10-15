import { Request, Response, NextFunction } from "express";
import * as svc from "../services/eventsServices";

<<<<<<< HEAD
export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const organizerId = req.user.id; // set by your auth middleware from access token
    const ev = await svc.create(organizerId, req.body);
    res.status(201).json(ev);
  } catch (err) { next(err); }
}

export async function listMyEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const organizerId = req.user.id;
    const rows = await svc.listMine(organizerId);
    res.json(rows);
  } catch (err) { next(err); }
}
=======
// GET /v1/events
// For now, return stub data matching the Event schema in routes/events.ts
export async function listEvents(req: Request, res: Response) {
  // shape matches components.schemas.Event[]
  res.json([{ 
      id: "evt_001", 
      name: "Park Cleanup", 
      starts_at: new Date().toISOString(), 
      ends_at: new Date(Date.now()+7200e3).toISOString(), 
      location: { lat: 49.28, lon: -123.12 }, 
      verifier: { id: "org_12", name: "City Cleanups" } 
    }]);
}
>>>>>>> 692b2b2 (Added Unit and Integration Tests)
