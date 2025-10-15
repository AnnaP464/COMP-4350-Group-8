import { query } from "./connect";
import type { SessionRow } from "../contracts/db.contracts";
export type RefreshSession = {
  jti: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
  replaced_by: string | null;
  created_at: string;
};

 async function create(rec: {
  jti: string;
  userId: string;
  expiresAt: Date;
}): Promise<void> {
  await query(
    `
    INSERT INTO refresh_tokens (jti, user_id, expires_at)
    VALUES ($1, $2, $3)
    `,
    [rec.jti, rec.userId, rec.expiresAt.toISOString()]
  );
}

async function findByJti(jti: string): Promise<SessionRow | null> {
  const { rows } = await query<SessionRow>(
    `SELECT * FROM refresh_tokens WHERE jti = $1`,
    [jti]
  );
  return rows[0] ?? null;
}

 async function revoke(jti: string): Promise<void> {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE jti = $1`, [jti]);
}

 async function revokeAllForUser(userId: string): Promise<void> {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
}

export const sessions = {
  create,
  findByJti,
  revoke,
  revokeAllForUser,
};

//not part of contract 
export async function setReplacedBy(oldJti: string, newJti: string): Promise<void> {
  await query(`UPDATE refresh_tokens SET replaced_by = $2, revoked_at = now() WHERE jti = $1`, [oldJti, newJti]);
}