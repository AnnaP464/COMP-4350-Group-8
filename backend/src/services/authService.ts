import * as tokens from "./tokenService";
import type {
  AuthService,
  LoginInput, 
  RefreshInput,
  LoginResult, 
  RegisterResult, 
  RefreshResult,
} from "../contracts/auth.contracts";

import type { UserPublic as PublicUser } from "../contracts/domain.types";
import type { Role } from "../contracts/domain.types";
import type { UserModel as User} from "../contracts/db.contracts";
import type { SessionsModel as Sessions } from "../contracts/db.contracts";

import { compare, hash } from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
// import own typed errors instead of Error

const SALT_ROUNDS = 10;

function toPublicUser(u: { email: string; username: string; role: Role }): PublicUser {
  return { email: u.email, username: u.username, role: u.role };
}

export function makeAuthService(deps: { users: User; sessions: Sessions }): AuthService {
  const { users, sessions } = deps;

  return {
    async register(input: { username:string; email:string; password:string; role:string }): Promise<RegisterResult> {
      const exists = await users.findByEmail(input.email);
      if (exists) throw new Error("Email already registered");

      // use bcrypt.hash to hash password 
      const password_hash = await hash(input.password, SALT_ROUNDS);
      if (input.role !== "Organizer" && input.role !== "Volunteer")
        throw new Error("Invalid role"); // should normally be caught earlier by zod
      
      const user = await users.create({
        email: input.email,
        username: input.username,
        password_hash: password_hash,
        role: input.role as Role,         
      });

      //const user = await users.create(hashed_user); 
      const accessToken = tokens.issueAccessToken({id: user.id, role: user.role});
      const { token: refreshToken, jti } = tokens.issueRefreshToken({id: user.id, role: user.role});

      // persistence for refresh token
      await sessions.create({ jti, userId: user.id, expiresAt: new Date(Date.now() + 30*24*3600*1000) });

      return { accessToken, refreshToken, user: toPublicUser(user) };
    },

    async login(input: LoginInput): Promise<LoginResult> {
      const user = await users.findByEmail(input.email);

      if (!user) throw new Error("Invalid credentials");

      // user.password_hash is from DB, input.password is plaintext
      // use bcrypt.compare to compare
      const ok = await compare(input.password, user.password_hash);
      if (!ok) throw new Error("Invalid credentials");

      const accessToken = tokens.issueAccessToken({id: user.id, role: user.role});
      const { token: refreshToken, jti } = tokens.issueRefreshToken({id: user.id, role: user.role});
      await sessions.create({ jti, userId: user.id, expiresAt: new Date(Date.now() + 30*24*3600*1000) });

      return { accessToken, refreshToken, user: toPublicUser(user) };
    },

    async refresh(input: RefreshInput): Promise<RefreshResult> {
      const { refreshToken: oldRefreshToken } = input;
      const decoded = tokens.verifyRefresh(oldRefreshToken) as JwtPayload || String; // throws if invalid/expired

      if (typeof decoded === "string" || !decoded.sub || !decoded.jti) {
        throw new Error("Malformed refresh token");
      }

      const userId = decoded.sub;   // string
      const oldJti = decoded.jti;   // string
      //const exp    = decoded.exp;   // number | undefined

      const row = await sessions.findByJti(oldJti);
      if (!row || row.revoked_at) {
        // REUSE DETECTED or token not known -> nuke all sessions for user (optional policy)
        await sessions.revokeAllForUser(userId);
        throw new Error("Invalid refresh token");
      }

      // Rotate: revoke old and issue new
      await sessions.revoke(oldJti);

      const user = await users.findById(userId);
      if (!user) throw new Error("User not found");

      const accessToken = tokens.issueAccessToken({id: user.id, role: user.role});
      const { token: refreshToken, jti: newJti } = tokens.issueRefreshToken({id: user.id, role: user.role});

      // Store the new refresh token’s jti (with its expiration timestamp)
      const newExp = new Date(Date.now() + 30*24*3600*1000);
      await sessions.create({ jti: newJti, userId: user.id, expiresAt: newExp });

      return {
        accessToken,
        refreshToken,
      };
    },
  };
}
