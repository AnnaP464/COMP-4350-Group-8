import { query } from "./connect";

export async function getUserProfileByUserId(userId: string) {
  const { rows } = await sql`select * from user_profiles where user_id = ${userId}`;
  return rows[0] ?? null;
}

export async function upsertUserProfile(
  userId: string,
  data: Record<string, unknown>,
  opts: { replace: boolean }
) {
  if (opts.replace) {
    const { rows } = await sql`
      insert into user_profiles (user_id, display_name, bio, avatar_url, timezone, phone, languages, city, country, contact_pref)
      values (${userId}, ${data.display_name}, ${data.bio}, ${data.avatar_url}, ${data.timezone}, ${data.phone}, ${data.languages}, ${data.city}, ${data.country}, ${data.contact_pref})
      on conflict (user_id) do update set
        display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        timezone = EXCLUDED.timezone,
        phone = EXCLUDED.phone,
        languages = EXCLUDED.languages,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        contact_pref = EXCLUDED.contact_pref,
        updated_at = now()
      returning *;
    `;
    return { created: rows.length && rows[0].created_at === rows[0].updated_at, profile: rows[0] };
  } else {
    // Partial merge
    const current = await getUserProfileByUserId(userId);
    const merged = { ...current, ...data };
    const { rows } = await sql`
      update user_profiles set
        display_name = ${merged.display_name},
        bio = ${merged.bio},
        avatar_url = ${merged.avatar_url},
        timezone = ${merged.timezone},
        phone = ${merged.phone},
        languages = ${merged.languages},
        city = ${merged.city},
        country = ${merged.country},
        contact_pref = ${merged.contact_pref},
        updated_at = now()
      where user_id = ${userId}
      returning *;
    `;
    // If no row existed, you could fall back to an insert here.
    return { created: false, profile: rows[0] };
  }
}
