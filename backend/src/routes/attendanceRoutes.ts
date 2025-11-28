// import { Router } from "express";
// import { z } from "zod";
// import { validateRequest } from "../middleware/validateRequest";
// import { requireAuth } from "../middleware/requireAuth";
// import type { AttendanceController } from "../contracts/attendance.ctrl.contracts";

// const EventIdParam = z.object({ eventId: z.string().uuid() });

// const LocationBody = z.object({
//   lon: z.number().gte(-180).lte(180),
//   lat: z.number().gte(-90).lte(90),
//   accuracy_m: z.number().int().positive().optional(),
// }).strict();

// export function createEventAttendanceRoutes(ctrl: AttendanceController) {
//   const r = Router();

//   // POST /events/:eventId/attendance/sign-in
//   r.post(
//     "/events/:eventId/attendance/sign-in",
//     requireAuth(), // or requireAuth() if you don't want to restrict by role
//     validateRequest({ params: EventIdParam, body: LocationBody }),
//     (req, res) => ctrl.signIn(req, res)
//   );

//   // POST /events/:eventId/attendance/sign-out
//   r.post(
//     "/events/:eventId/attendance/sign-out",
//     requireAuth(),
//     validateRequest({ params: EventIdParam, body: LocationBody }),
//     (req, res) => ctrl.signOut(req, res)
//   );

//   // GET /events/:eventId/attendance/status
//   r.get(
//     "/events/:eventId/attendance/status",
//     requireAuth(),
//     validateRequest({ params: EventIdParam }),
//     (req, res) => ctrl.getStatus(req, res)
//   );

//   return r;
// }
