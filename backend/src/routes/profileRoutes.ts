// routes/profile.ts
import { Router } from "express";
import { z } from "zod";
import requireAuth from "../middleware/requireAuth";
import { upsertUserProfile, getUserProfileByUserId } from "../db/userProfiles";

const router = Router();

const profileSchema = z.object({
  display_name: z.string().min(1).max(80).optional(),
  bio: z.string().max(1000).optional(),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

router.get("/v1/users/me/profile", requireAuth, async (req, res, next) => {
  try {
    const profile = await getUserProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (e) { next(e); }
});

router.put("/v1/users/me/profile", requireAuth, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const result = await upsertUserProfile(req.user.id, data, { replace: true });
    res.status(result.created ? 201 : 200).json(result.profile);
  } catch (e) { next(e); }
});

router.patch("/v1/users/me/profile", requireAuth, async (req, res, next) => {
  try {
    const data = profileSchema.partial().parse(req.body);
    const result = await upsertUserProfile(req.user.id, data, { replace: false });
    res.json(result.profile);
  } catch (e) { next(e); }
});

export default router;
