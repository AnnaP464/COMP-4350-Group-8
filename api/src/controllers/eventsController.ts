import { Request, Response } from "express";


export async function listEvents(req: Request, res: Response) {
  // shape matches components.schemas.Event[]
  res.json([
    { id: "evt_001", name: "Park Cleanup", starts_at: new Date().toISOString(), ends_at: new Date(Date.now()+7200e3).toISOString(), location: { lat: 49.28, lon: -123.12 }, verifier: { id: "org_12", name: "City Cleanups" } }
  ]);
}