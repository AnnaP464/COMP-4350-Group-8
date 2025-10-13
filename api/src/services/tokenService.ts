// token.service.ts
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";
const ISSUER = "your-app";
const AUD    = "your-app-web";

type AccessClaims  = { sub: string; role: string };
type RefreshClaims = { sub: string; role: string; jti: string };


export function issueAccessToken(user: { id: string; role: string }) {
  const payload: AccessClaims = { sub: user.id, role: user.role };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: ACCESS_TTL, issuer: ISSUER, audience: AUD,
  });
}

export function issueRefreshToken(user: { id: string; role: string }, jti = randomUUID()) {
  const payload: RefreshClaims = { sub: user.id, role: user.role, jti };
  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TTL, issuer: ISSUER, audience: AUD,
  });
  return { token, jti };
}

export function verifyAccess(token: string) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!, { issuer: ISSUER, audience: AUD });
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, { issuer: ISSUER, audience: AUD });
}