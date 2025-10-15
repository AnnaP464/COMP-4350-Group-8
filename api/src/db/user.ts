import { Role } from "../contracts/domain.types";
import { query } from "./connect";

import type { DbUser } from "../contracts/db.contracts";

 async function findByEmail(email: string): Promise<DbUser | null> {
  const { rows } = await query<DbUser>(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

 async function findByUsername(username: string): Promise<DbUser | null> {
  const { rows } = await query<DbUser>(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return rows[0] ?? null;
}

 async function findById(id: string): Promise<DbUser | null> {
  const { rows } = await query<DbUser>(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

 async function create(opts: {
  email: string;
  username: string;
  password_hash: string;
  role?: string;
}): Promise<DbUser> {
  const role = opts.role ?? "user";
  const { rows } = await query<DbUser>(
    `
    INSERT INTO users (email, username, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [opts.email, opts.username, opts.password_hash, role]
  );
  return rows[0];
}
export const users = {
  findByEmail,
  findByUsername,
  findById,
  create,
};