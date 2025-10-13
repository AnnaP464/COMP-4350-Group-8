import { Router } from "express";
const router = Router();
import { listEvents } from "../controllers/eventsController";

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
 */
router.get("/", listEvents);

export default router;
