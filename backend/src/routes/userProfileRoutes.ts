// routes/userProfile.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { validateRequest } from "../middleware/validateRequest";
import { schemas } from "../spec/zod";
import multer = require("multer");
import path from "path";
import {
  getMyProfile,
  putMyProfile,
  patchMyProfile,
  listMySocialLinks,
  upsertMySocialLink,
  deleteMySocialLink,
  getMyStats,
} from "../controllers/userProfileController";

const r = Router();

//chatgpt
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "/uploads"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${req.user?.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

/**
 * @swagger
 * tags:
 *   - name: User Profiles
 *     description: Read and update the authenticated user's profile & social links
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         userId:     { type: string, example: "c4b52790-9e44-4a0b-96e8-7c8e6e0f2aab" }
 *         bio:        { type: string, example: "Volunteer and CS student." }
 *         avatarUrl:  { type: string, example: "https://cdn.example.com/u/123/avatar.jpg" }
 *         phone:      { type: string, example: "+1-204-555-5555" }
 *         city:       { type: string, example: "Winnipeg" }
 *         country:    { type: string, example: "Canada" }
 *         contactPref:
 *           type: string
 *           enum: [email, phone, none]
 *         updatedAt:  { type: string, format: date-time }
 *
 *     UserProfileUpdateSchema:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         bio:        { type: string, maxLength: 1000 }
 *         avatarUrl:  { type: string, format: uri, nullable: true}
 *         phone:      { type: string }
 *         city:       { type: string }
 *         country:    { type: string }
 *         contactPref:
 *           type: string
 *           enum: [email, phone, none]
 *
 *     SocialLink:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         id:        { type: string, example: "3b8e2c8b-d59f-4d7f-8d9a-2a8e7b3f6f21" }
 *         userId:    { type: string }
 *         platform:  { type: string, example: "linkedin" }
 *         handle:    { type: string, example: "sudipta" }
 *         url:       { type: string, format: uri, example: "https://linkedin.com/in/sudipta" }
 *         createdAt: { type: string, format: date-time }
 *
 *     SocialLinkUpsertSchema:
 *       type: object
 *       additionalProperties: false
 *       required: [url]
 *       properties:
 *         url:    { type: string, format: uri }
 *         handle: { type: string }
 */

/**
 * @swagger
 * /v1/users/me/profile:
 *   get:
 *     tags: [User Profiles]
 *     summary: Get the authenticated user's profile
 *     responses:
 *       200:
 *         description: Profile found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags: [User Profiles]
 *     summary: Create or replace the authenticated user's profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpdateSchema'
 *     responses:
 *       200:
 *         description: Upserted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *   patch:
 *     tags: [User Profiles]
 *     summary: Partially update the authenticated user's profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpdateSchema'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
r.get(
  "/v1/users/me/profile",
  requireAuth(),
  getMyProfile
);

/**
 * @swagger
 * /v1/users/me/stats:
 *   get:
 *     tags: [User Profiles]
 *     summary: Get the authenticated volunteer's statistics (total hours, completed jobs, etc.)
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMinutes:
 *                   type: integer
 *                   example: 480
 *                 totalHours:
 *                   type: number
 *                   example: 8.0
 *                 jobsCompleted:
 *                   type: integer
 *                   example: 5
 *                 upcomingJobs:
 *                   type: integer
 *                   example: 2
 *       401:
 *         description: Unauthorized
 */
r.get(
  "/v1/users/me/stats",
  requireAuth(),
  getMyStats
);

r.put(
  "/v1/users/me/profile",
  requireAuth(),
  // expects codegen to expose schemas.UserProfileUpdate
  validateRequest({ body: schemas.UserProfileUpdateSchema }),
  putMyProfile
);

r.patch(
  "/v1/users/me/profile",
  requireAuth(),
  validateRequest({ body: schemas.UserProfileUpdateSchema }),
  patchMyProfile
);

/**
 * @swagger
 * /v1/users/me/social-links:
 *   get:
 *     tags: [User Profiles]
 *     summary: List the authenticated user's social links
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SocialLink'
 *       401:
 *         description: Unauthorized
 *
 * /v1/users/me/social-links/{platform}:
 *   put:
 *     tags: [User Profiles]
 *     summary: Upsert a social link for a platform (e.g., twitter, linkedin)
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema: { type: string }
 *         example: linkedin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SocialLinkUpsertSchema'
 *     responses:
 *       200:
 *         description: Upserted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SocialLink'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *   delete:
 *     tags: [User Profiles]
 *     summary: Delete a social link for a platform
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema: { type: string }
 *         example: linkedin
 *     responses:
 *       204:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
r.get(
  "/v1/users/me/social-links",
  requireAuth(),
  listMySocialLinks
);

r.put(
  "/v1/users/me/social-links/:platform",
  requireAuth(),
  // expects codegen to expose schemas.SocialLinkUpsert
  validateRequest({ body: schemas.SocialLinkUpsertSchema }),
  upsertMySocialLink
);

r.delete(
  "/v1/users/me/social-links/:platform",
  requireAuth(),
  deleteMySocialLink
);


// POST /v1/users/me/avatar
r.post(
  "/v1/users/me/avatar",
  requireAuth(),
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      if (!req.file) 
        return res.status(400).json({ error: "No file uploaded" });
      
      const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
      const url = `${base}/uploads/${req.file.filename}`;
      //immediately update profile with new URL
      // await upsertUserProfile(req.user!.id, { avatarUrl: url });
      return res.status(201).json({ avatarUrl: url });
    } catch (e) {
      next(e);
    }
  }
);


export function createUserProfileRoutes() {
  return r;
}
export default r;
