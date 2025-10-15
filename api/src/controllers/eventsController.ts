import { Request, Response, NextFunction } from "express";
import * as svc from "../services/eventsServices";

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
