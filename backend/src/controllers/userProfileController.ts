// controllers/userProfileController.ts
import { Request, Response, NextFunction } from "express";
import {
  getUserProfileByUserId,
  upsertUserProfile,
  patchUserProfile,
  getSocialLinksByUserId,
  upsertSocialLink,
  deleteSocialLink,
} from "../db/userProfile";
import { getVolunteerStatsService } from "../services/eventsService";

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id ?? req.user?.id; // handle either shape
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const row = await getUserProfileByUserId(userId);
    if (!row) return res.status(404).json({ error: "Profile not found" });
    return res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function putMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Body already validated by validateRequest + generated zod
    const row = await upsertUserProfile(userId, req.body ?? {});
    return res.status(200).json(row);
  } catch (err) {
    next(err);
  }
}

export async function patchMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const row = await patchUserProfile(userId, req.body ?? {});
    return res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function listMySocialLinks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rows = await getSocialLinksByUserId(userId);
    return res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function upsertMySocialLink(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { platform } = req.params;
    const { url, handle } = req.body as { url: string; handle?: string | null };

    const row = await upsertSocialLink(userId, { platform, url, handle: handle ?? null });
    return res.status(200).json(row);
  } catch (err) {
    next(err);
  }
}

export async function deleteMySocialLink(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { platform } = req.params;
    const result = await deleteSocialLink(userId, platform);
    if (!result.deleted) return res.status(404).json({ error: "Social link not found" });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getMyStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const stats = await getVolunteerStatsService(userId);
    return res.json(stats);
  } catch (err) {
    next(err);
  }
}
