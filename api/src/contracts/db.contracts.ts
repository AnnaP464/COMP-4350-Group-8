import { Role } from "./domain.types";


// DB-facing entity shapes (not exposed to controllers)
export type DbUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
  password_hash: string;
  created_at?: Date;
  updated_at?: Date;
};

export type SessionRow = {
  jti: string;
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by: string | null;
  created_at?: Date;
};

// Users repository (AuthService depends on this)
export interface UserModel {
  findByEmail(email: string): Promise<DbUser | null>;
  findById(id: string): Promise<DbUser| null>;
  create(user: {
    email: string;
    username: string;
    password_hash: string;
    role?: Role;
  }): Promise<DbUser>;
}

// Sessions repository for refresh rotation/revocation
export interface SessionsModel {
  create(session: { jti: string; userId: string; expiresAt: Date }): Promise<void>;
  findByJti(jti: string): Promise<SessionRow | null>;
  revoke(jti: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}