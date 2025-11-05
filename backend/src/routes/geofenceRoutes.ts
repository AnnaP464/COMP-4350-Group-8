// src/routes/events.geofences.routes.ts
import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validateRequest";
import type { GeofencesController } from "../contracts/geofences.ctrl.contracts";

const EventIdParam = z.object({ eventId: z.string().uuid() });
const IdParam = z.object({ id: z.string().uuid() });

const PolygonBody = z.object({
  name: z.string().min(1),
  geojson4326: z.union([z.string().min(2), z.record(z.any())]),
}).strict();

const CircleBody = z.object({
  name: z.string().min(1),
  lon: z.number().gte(-180).lte(180),
  lat: z.number().gte(-90).lte(90),
  radius_m: z.number().positive(),
}).strict();

export function createEventGeofencesRoutes(ctrl: GeofencesController) {
  const r = Router();

  // POST /events/:eventId/geofences/polygon
  r.post(
    "/events/:eventId/geofences/polygon",
    validateRequest({ params: EventIdParam, body: PolygonBody }),
    ctrl.createPolygon
  );

  // POST /events/:eventId/geofences/circle
  r.post(
    "/events/:eventId/geofences/circle",
    validateRequest({ params: EventIdParam, body: CircleBody }),
    ctrl.createCircle
  );

  // GET /events/:eventId/geofences
  r.get(
    "/events/:eventId/geofences",
    validateRequest({ params: EventIdParam }),
    ctrl.listByEvent
  );

  // GET /geofences/:id
  r.get(
    "/geofences/:id",
    validateRequest({ params: IdParam }),
    ctrl.getById
  );

  // DELETE /geofences/:id
  r.delete(
    "/geofences/:id",
    validateRequest({ params: IdParam }),
    ctrl.remove
  );

  return r;
}