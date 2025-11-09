// services/userProfileService.ts
import {
  getUserProfileByUserId,
  upsertUserProfile,
  patchUserProfile,
  getSocialLinksByUserId,
  upsertSocialLink,
  deleteSocialLink,
  type UserProfileRow,
  type SocialLinkRow,
} from "../db/userProfile";

/** Read the authenticated user's profile */
export async function getMyProfileService(userId: string): Promise<UserProfileRow | null> {
  return getUserProfileByUserId(userId);
}

/** Create/replace the authenticated user's profile (PUT semantics) */
export async function putMyProfileService(
  userId: string,
  data: Partial<Omit<UserProfileRow, "userId" | "updatedAt">>
): Promise<UserProfileRow> {
  return upsertUserProfile(userId, data);
}

/** Partially update the authenticated user's profile (PATCH semantics) */
export async function patchMyProfileService(
  userId: string,
  data: Partial<Omit<UserProfileRow, "userId" | "updatedAt">>
): Promise<UserProfileRow> {
  return patchUserProfile(userId, data);
}

/** List the authenticated user's social links */
export async function listMySocialLinksService(userId: string): Promise<SocialLinkRow[]> {
  return getSocialLinksByUserId(userId);
}

/** Upsert a single social link for a platform */
export async function upsertMySocialLinkService(
  userId: string,
  args: { platform: string; url: string; handle?: string | null }
): Promise<SocialLinkRow> {
  return upsertSocialLink(userId, {
    platform: args.platform,
    url: args.url,
    handle: args.handle ?? null,
  });
}

/** Delete a social link by platform */
export async function deleteMySocialLinkService(
  userId: string,
  platform: string
): Promise<{ deleted: boolean }> {
  return deleteSocialLink(userId, platform);
}
