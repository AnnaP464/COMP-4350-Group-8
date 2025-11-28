import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth"; // your JWT middleware
import { validateRequest } from "../middleware/validateRequest";
import { schemas} from "../spec/zod";

import type { GeofencesController } from "../contracts/geofences.ctrl.contracts";
//import type { AttendanceController } from "../contracts/attendance.ctrl.contracts";

import { createEventGeofencesRoutes } from "./geofenceRoutes";
//import { createEventAttendanceRoutes } from "./attendanceRoutes";


import {
  // existing
  createEvent,
  listEvents,
  // NEW / RENAMED for application flow
  applyForEvent,
  withdrawApplication,
  listMyApplications,
  listApplicants,
  listAccepted,
  acceptApplicant,
  rejectApplicant,
  
  getAttendanceStatus,
  signInAttendance,
  signOutAttendance
} from "../controllers/eventsController";
/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Volunteer event management & search
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required: [id, name, starts_at, ends_at, location, verifier]
 *       properties:
 *         id:
 *           type: string
 *           example: "evt_001"
 *         name:
 *           type: string
 *           example: "Downtown Park Cleanup"
 *         starts_at:
 *           type: string
 *           format: date-time
 *           example: "2025-10-18T09:00:00Z"
 *         ends_at:
 *           type: string
 *           format: date-time
 *           example: "2025-10-18T12:00:00Z"
 *         location:
 *           type: object
 *           properties:
 *             lat: { type: number, example: 49.2827 }
 *             lon: { type: number, example: -123.1207 }
 *         verifier:
 *           type: object
 *           properties:
 *             id: { type: string, example: "org_12" }
 *             name: { type: string, example: "Vancouver Cleanups" }
 * 
 *     CreateEventSchema:
 *       type: object
 *       additionalProperties: false
 *       required: [jobName, description, location, startTime, endTime]
 *       properties:
 *         jobName:     { type: string, minLength: 1, example: "Park Cleanup" }
 *         description: { type: string, minLength: 1, example: "Bring gloves" }
 *         location:    { type: string, minLength: 1, example: "Central Park" }
 *         startTime:   { type: string, format: date-time, example: "2025-10-20T14:00:00Z" }
 *         endTime:     { type: string, format: date-time, example: "2025-10-20T16:00:00Z" }
 *     
 *     ListEventsQuery:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         from: { type: string, format: date-time }
 *         to:   { type: string, format: date-time }
 *         mine: { type: string, enum: ["0","1"] }
 * 
 *     
 *     EventApplySchema:
 *       type: object
 *       additionalProperties: false
 *       required: [eventId]
 *       properties:
 *         eventId:
 *           type: string
 *           format: uuid
 *           example: "5deccda0-3589-42f9-8820-dd02e99bca9f"
 */



/**
 * @swagger
 * /v1/events:
 *   get:
 *     tags: [Events]  
 *     summary: List events
 *     description: Returns all available volunteer events, optionally filtered by date or location.
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Only include events starting after this date.
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Only include events starting before this date.
 *       - in: query
 *         name: mine
 *         schema: { type: string, enum: ["0","1"] }
 *         description: If "1", only include events created by the authenticated
 *       - in: query
 *         name: registered
 *         schema: { type: string, enum: ["0","1"] }
 *         description: If "1", only include events the authenticated user is registered for.
 *
 *     responses:
 *       200:
 *         description: A list of events.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Internal server error.
 *   post:
 *     tags: [Events]
 *     summary: Create event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEventSchema'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /v1/events/register:
 *   post:
 *     tags: [Events]
 *     summary: Register the authenticated user for an event
 *     description: Registers the currently authenticated user for the specified event.
 *     security:
 *       - bearerAuth: []         # requires Authorization: Bearer <token>
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: "evt_56789"
 *     responses:
 *       200:
 *         description: Successfully registered the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered for event successfully."
 *       400:
 *         description: Missing or invalid fields
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /v1/events/deregister:
 *   delete:
 *     tags: [Events]
 *     summary: Deregister the authenticated user for an event
 *     description: Deregisters the currently authenticated user for the specified event.
 *     security:
 *       - bearerAuth: []         # requires Authorization: Bearer <token>
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: "evt_56789"
 *     responses:
 *       200:
 *         description: Successfully deregistered the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User deregistered for event successfully."
 *       400:
 *         description: Missing or invalid fields
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /v1/events/apply:
 *   post:
 *     tags: [Events]
 *     summary: Apply for an event
 *     description: The authenticated volunteer applies for a specific event.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventApplySchema'
 *     responses:
 *       200:
 *         description: Application created
 *       400:
 *         description: Invalid payload/request body (missing/invalid eventId)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       409:
 *         description: Already applied or already accepted
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/events/withdraw:
 *   delete:
 *     tags: [Events]
 *     summary: Withdraw an application
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: "evt_123"
 *     responses:
 *       200:
 *         description: Application withdrawn
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 */


/**
 * @swagger
 * /v1/events/me/applications:
 *   get:
 *     tags: [Events]
 *     summary: List my applications
 *     description: Returns all applications for the authenticated user with their statuses.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications
 *       401:
 *         description: Unauthorized
 */


export function createEventsRouter(deps: {
  geofencesController: GeofencesController;
  // attendanceController: AttendanceController;
  // ...other controllers for events domain
}) 
{
  const r = Router();

  // Public: list all events (optionally filter to "mine" via ?mine=1)
  // validate query first, then only auth if ?mine=1
  r.get(
    "/",
    //validateRequest({ query: schemas.ListEventsQuery }),
    (req, res, next) => {
      //organizer events
      const wantsMine = String(req.query.mine || "").toLowerCase() === "1";
      //volunteer registered events
      const wantsRegistered = String(req.query.registered || "").toLowerCase() === "1";
      if (! (wantsMine || wantsRegistered) ) 
        return next();
      // run the real auth middleware when either filter is requested
      return requireAuth()(req, res, next);
    },
    listEvents
  );
   
  // r.post(
  //   "/",
  //   requireAuth(),
  //   (req, _res, next) => { console.log("[router] after requireAuth"); next(); },
  //   validateRequest({ body: schemas.CreateEventSchema }),
  //   (req, _res, next) => { console.log("[router] after validateRequest"); next(); },
  //   createEvent
  // );


  // Public: list all events (optionally filter to "mine" via ?mine=1) 
  // validate query first, then only auth if ?mine=1
  //GET /v1/events
  // r.get(
  //   "/",
  //   //validateRequest({ query: schemas.ListEventsQuery }),
  //   (req, res, next) => {
  //     const wantsMine = String(req.query.mine || "").toLowerCase() === "1";
  //     if (!wantsMine) 
  //       return next();
  //     // run the real auth middleware when mine=1
  //     return requireAuth()(req, res, next);
  //   },
  //   listEvents
  // );
  
  //POST /v1/events
  r.post(
    "/",
    requireAuth(),
    (req, _res, next) => { console.log("[router] after requireAuth"); next(); },
    validateRequest({ body: schemas.CreateEventSchema }),
    (req, _res, next) => { console.log("[router] after validateRequest"); next(); },
    createEvent
  );


  /* -------------------------------------------------------------------
                      VOLUNTEER – application flow
  ----------------------------------------------------------------------*/
 //POST /v1/events/apply
 r.post(
    "/apply",
    requireAuth(),
    validateRequest({ body: schemas.EventApplySchema }), 
    applyForEvent
  );

  // geofences under /events
  r.use(createEventGeofencesRoutes(deps.geofencesController));
  // Attendance under /events
  //(POST /events/:eventId/attendance/sign-in, sign-out, status)
  // r.use(createEventAttendanceRoutes(deps.attendanceController));
  
  //DELETE /v1/events/withdraw
  r.delete(
    "/withdraw",
    requireAuth(),
    // validateRequest({ body: schemas.EventWithdrawSchema }),
    withdrawApplication
  );

  //GET /v1/myapllications
  r.get(
    "/me/applications", 
    requireAuth(), 
    listMyApplications
  );

  /*-----------------------------------------------------------------------
                            Organizer flow
  Organizers gets applicants, accepted applicants, accept/reject applications 
  -------------------------------------------------------------------------*/

  // View my applications with status (applied/accepted/rejected/withdrawn)

  // GET /v1/events/:eventId/applicants
  r.get("/:eventId/applicants", 
    requireAuth(), 
    listApplicants
  );
  
  // GET /v1/events/:eventId/accepted
  r.get("/:eventId/accepted",
    requireAuth(),
    listAccepted
  );

  r.patch(
    "/:eventId/applicants/:userId/accept",
    requireAuth(),
    acceptApplicant
  );

  r.patch(
    "/:eventId/applicants/:userId/reject",
    requireAuth(),
    rejectApplicant
  );

    // Attendance endpoints
  r.get(
    "/:eventId/attendance/status",
    requireAuth(),
    getAttendanceStatus
  );

  r.post(
    "/:eventId/attendance/sign-in",
    requireAuth(),
    signInAttendance
  );

  r.post(
    "/:eventId/attendance/sign-out",
    requireAuth(),
    signOutAttendance
  );


  
  return r;
}
// export default r;

