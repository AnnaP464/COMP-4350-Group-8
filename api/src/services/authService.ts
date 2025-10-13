// authService.ts
import * as tokens from "./tokenService";
import * as users from "../db/user";       // findByEmail, findById, create
import * as sessions from "../db/Session"; // OPTIONAL: findByJti, revoke, create
import { compare, hash } from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
// import own typed errors instead of Error

const SALT_ROUNDS = 10;

type PublicUser = { email: string; username: string; role: string };
type AuthResponse = { access_token: string; refresh_token: string; user: PublicUser };

function toPublicUser(u: { email: string; username: string; role: string }): PublicUser {
  return { email: u.email, username: u.username, role: u.role };
}

export async function register(input: { username: string; email: string; password: string }): Promise<AuthResponse> {
  const exists = await users.findByEmail(input.email);
  if (exists) throw new Error("Email already registered");

  // use bcrypt.hash to hash password 
  const password_hash = await hash(input.password, SALT_ROUNDS);
  const hashed_user = await users.create({
    email: input.email,
    username: input.username,
    password_hash,         
  });

  const user = await users.create(hashed_user); 
  const access_token = tokens.issueAccessToken(user);
  const { token: refresh_token, jti } = tokens.issueRefreshToken(user);

  // persistence for refresh token
  await sessions.create({ jti, userId: user.id, expiresAt: new Date(Date.now() + 30*24*3600*1000) });

  return { access_token, refresh_token, user: toPublicUser(user) };
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  const user = await users.findByEmail(input.email);

  if (!user) throw new Error("Invalid credentials");

  // user.password_hash is from DB, input.password is plaintext
  // use bcrypt.compare to compare
  const ok = await compare(input.password, user.password_hash);
  if (!ok) throw new Error("Invalid credentials");

  const access_token = tokens.issueAccessToken(user);
  const { token: refresh_token, jti } = tokens.issueRefreshToken(user);
  await sessions.create({ jti, userId: user.id, expiresAt: new Date(Date.now() + 30*24*3600*1000) });

  return { access_token, refresh_token, user: toPublicUser(user) };
}


export async function refresh(oldRefreshToken: string) {

  const decoded = tokens.verifyRefresh(oldRefreshToken) as JwtPayload || String; // throws if invalid/expired

  if (typeof decoded === "string" || !decoded.sub || !decoded.jti) {
    throw new Error("Malformed refresh token");
  }

  const userId = decoded.sub;   // string
  const oldJti = decoded.jti;   // string
  const exp    = decoded.exp;   // number | undefined


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

  const access_token = tokens.issueAccessToken(user);
  const { token: refresh_token, jti: newJti } = tokens.issueRefreshToken(user);

  // Store the new refresh token’s jti (with its expiration timestamp)
  const newExp = new Date(Date.now() + 30*24*3600*1000);
  await sessions.create({ jti: newJti, userId: user.id, expiresAt: newExp });


  return {
    access_token,
    refresh_token,
    user: toPublicUser(user),
  };
}