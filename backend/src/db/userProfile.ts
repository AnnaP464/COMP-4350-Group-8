// db/userProfile.ts
import { query } from "./connect";

/** CamelCase row shape returned to callers */
export type UserProfileRow = {
  userId: string;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  contactPref: "email" | "phone" | "none" | null;
  updatedAt: string; // timestamptz -> ISO string
};

export type SocialLinkRow = {
  id: string;
  userId: string;
  platform: string;
  handle: string | null;
  url: string;
  createdAt: string; // timestamptz
};

/** ----- Queries: user_profiles ----- **/

export async function getUserProfileByUserId(
  userId: string
): Promise<UserProfileRow | null> {
  const { rows } = await query<UserProfileRow>(
    `
    SELECT
      user_id      AS "userId",
      bio          AS "bio",
      avatar_url   AS "avatarUrl",
      phone        AS "phone",
      city         AS "city",
      country      AS "country",
      contact_pref AS "contactPref",
      updated_at   AS "updatedAt"
    FROM user_profiles
    WHERE user_id = $1
    `,
    [userId]
  );
  return rows[0] ?? null;
}

/**
 * Upsert with full replacement semantics (PUT-like).
 * Any omitted field becomes NULL.
 */
export async function upsertUserProfile(
  userId: string,
  p: Partial<Omit<UserProfileRow, "userId" | "updatedAt">>
): Promise<UserProfileRow> {
  const { rows } = await query<UserProfileRow>(
    `
    INSERT INTO user_profiles
      (user_id, bio, avatar_url, phone, city, country, contact_pref)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (user_id) DO UPDATE SET
      bio          = EXCLUDED.bio,
      avatar_url   = EXCLUDED.avatar_url,
      phone        = EXCLUDED.phone,
      city         = EXCLUDED.city,
      country      = EXCLUDED.country,
      contact_pref = EXCLUDED.contact_pref,
      updated_at   = now()
    RETURNING
      user_id      AS "userId",
      bio          AS "bio",
      avatar_url   AS "avatarUrl",
      phone        AS "phone",
      city         AS "city",
      country      AS "country",
      contact_pref AS "contactPref",
      updated_at   AS "updatedAt"
    `,
    [
      userId,
      p.bio ?? null,
      p.avatarUrl ?? null,
      p.phone ?? null,
      p.city ?? null,
      p.country ?? null,
      p.contactPref ?? null,
    ]
  );
  return rows[0];
}

/**
 * Partial update (PATCH-like). Only updates provided keys.
 * If profile doesn't exist yet, it will create it with the provided fields.
 */
export async function patchUserProfile(
  userId: string,
  p: Partial<Omit<UserProfileRow, "userId" | "updatedAt">>
): Promise<UserProfileRow> {
  // Build dynamic SET list
  const sets: string[] = [];
  const vals: any[] = [userId]; // $1 is always userId
  let i = 1;

  const add = (col: string, val: any) => {
    sets.push(`${col} = $${++i}`);
    vals.push(val);
  };

  if ("bio" in p) add("bio", p.bio ?? null);
  if ("avatarUrl" in p) add("avatar_url", p.avatarUrl ?? null);
  if ("phone" in p) add("phone", p.phone ?? null);
  if ("city" in p) add("city", p.city ?? null);
  if ("country" in p) add("country", p.country ?? null);
  if ("contactPref" in p) add("contact_pref", p.contactPref ?? null);

  if (sets.length === 0) {
    // Nothing to change — return current (or create empty row if you prefer)
    const current = await getUserProfileByUserId(userId);
    if (current) return current;
    return upsertUserProfile(userId, {}); // create empty shell row
  }

  const sql = `
    UPDATE user_profiles
       SET ${sets.join(", ")}, updated_at = now()
     WHERE user_id = $1
     RETURNING
       user_id      AS "userId",
       bio          AS "bio",
       avatar_url   AS "avatarUrl",
       phone        AS "phone",
       city         AS "city",
       country      AS "country",
       contact_pref AS "contactPref",
       updated_at   AS "updatedAt"
  `;

  const { rows } = await query<UserProfileRow>(sql, vals);
  if (rows.length) return rows[0];

  // If no row to update, insert with provided fields
  return upsertUserProfile(userId, p);
}

/** ----- Queries: social_links ----- **/

export async function getSocialLinksByUserId(
  userId: string
): Promise<SocialLinkRow[]> {
  const { rows } = await query<SocialLinkRow>(
    `
    SELECT
      id         AS "id",
      user_id    AS "userId",
      platform   AS "platform",
      handle     AS "handle",
      url        AS "url",
      created_at AS "createdAt"
    FROM social_links
    WHERE user_id = $1
    ORDER BY platform
    `,
    [userId]
  );
  return rows;
}

/**
 * Upsert a single social link by (user_id, platform).
 * Use when saving one platform at a time from the UI.
 */
export async function upsertSocialLink(
  userId: string,
  link: { platform: string; url: string; handle?: string | null }
): Promise<SocialLinkRow> {
  const { rows } = await query<SocialLinkRow>(
    `
    INSERT INTO social_links (user_id, platform, handle, url)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (user_id, platform) DO UPDATE SET
      handle = EXCLUDED.handle,
      url    = EXCLUDED.url,
      created_at = social_links.created_at -- keep original created_at
    RETURNING
      id         AS "id",
      user_id    AS "userId",
      platform   AS "platform",
      handle     AS "handle",
      url        AS "url",
      created_at AS "createdAt"
    `,
    [userId, link.platform, link.handle ?? null, link.url]
  );
  return rows[0];
}

export async function deleteSocialLink(
  userId: string,
  platform: string
): Promise<{ deleted: boolean }> {
  const { rowCount } = await query(
    `DELETE FROM social_links WHERE user_id = $1 AND platform = $2`,
    [userId, platform]
  );
  return { deleted: (rowCount ?? 0) > 0 };
}
