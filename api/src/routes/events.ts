import { Router } from "express";
import { createEvent, listEvents, registerUserForEvent, deregisterUserForEvent } from "../controllers/eventsController";
import { requireAuth } from "../middleware/requireAuth"; // your JWT middleware
import { validateRequest } from "../middleware/validateRequest";
//import { z } from "zod";
import { schemas} from "../spec/zod";

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

const r = Router();

// Public: list all events (optionally filter to "mine" via ?mine=1)
//r.get("/", listEvents);    
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
//Auth-only : create event 
// r.post("/", requireAuth, (req, res, next) => {
//   console.log("Route reached");
//   next();
// },validateRequest({ body: schemas.CreateEventSchema }), createEvent);   
r.post(
  "/",
  requireAuth(),
  (req, _res, next) => { console.log("[router] after requireAuth"); next(); },
  validateRequest({ body: schemas.CreateEventSchema }),
  (req, _res, next) => { console.log("[router] after validateRequest"); next(); },
  createEvent
);

r.post(
  "/register",
  requireAuth(),
  registerUserForEvent
);

r.delete(
  "/deregister",
  requireAuth(),
  deregisterUserForEvent
);

//r.post("/",createEvent);                           // POST /v1/events      -> create

export default r;