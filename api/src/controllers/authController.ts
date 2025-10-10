import type { Request, Response } from "express";

/**
 * NOTE: These are STUBS for demo/dev only.
 * - No DB calls
 * - No hashing/JWTs
 * - Minimal validation
 * Replace with real service logic later.
 */

type PublicUser = {
  id: string;
  username: string;
  email: string;
  role: "VOLUNTEER" | "ORG_ADMIN" | "ADMIN";
};

// A dummy user to return in examples
const DUMMY_USER: PublicUser = {
  id: "vol_123",
  username: "alex",
  email: "alex@example.com",
  role: "VOLUNTEER",
};

// Fake token strings to look realistic
const makeAccessToken = () => "stub_access_token.abc.def";
const makeRefreshToken = () => "stub_refresh_token.ghi.jkl";

// cookies options for refresh token
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // set true when behind HTTPS
  sameSite: "lax" as const,
  path: "/v1/auth/refresh",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/** POST /v1/auth/register */
export async function registerUser(req: Request, res: Response) {
  const { username, email, password } = req.body ?? {};

  // Minimal input checks so Swagger “try it out” feels real
  if (!username || !email || !password) {
    return res.status(400).json({ message: "username, email, and password are required" });
  }
  // Pretend this email already exists to demo a 409 path
  if (String(email).toLowerCase() === "taken@example.com") {
    return res.status(409).json({ message: "Email already registered" });
  }

  // Issue stub tokens
  const accessToken = makeAccessToken();
  const refreshToken = makeRefreshToken();

  // Optionally set an HttpOnly refresh cookie (works if you’ve added cookie-parser + CORS credentials)
  try {
    res.cookie("refresh_token", refreshToken, refreshCookieOptions);
  } catch {
    // If cookie-parser not installed yet, skip silently
  }

  // Return access token + public user
  return res.status(201).json({
    access_token: accessToken,
    refresh_token: refreshToken, // keep for demos; you can remove if you prefer cookie-only later
    user: {
    ...DUMMY_USER,
    },
  });
}

/** POST /v1/auth/login */
export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  // In stub mode, accept anything except this password to demo 401
  if (String(password) === "wrong") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = makeAccessToken();
  const refreshToken = makeRefreshToken();

  try {
    res.cookie("refresh_token", refreshToken, refreshCookieOptions);
  } catch {
    // ignore if cookie middleware not present yet
  }

  return res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      ...DUMMY_USER,
    },
  });
}

/** POST /v1/auth/refresh */
export async function refreshToken(req: Request, res: Response) {
  // Accept either cookie or body for convenience during early dev
  const cookieToken = (req as any).cookies?.refresh_token;
  const bodyToken = req.body?.refresh_token;

  if (!cookieToken && !bodyToken) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  // No real verification; just mint a new access + refresh to simulate rotation
  const newAccess = makeAccessToken();
  const newRefresh = makeRefreshToken();

  try {
    res.cookie("refresh_token", newRefresh, refreshCookieOptions);
  } catch {
    // ignore if cookie middleware not present yet
  }

  return res.json({
    access_token: newAccess,
    refresh_token: newRefresh,
  });
}

/** POST /v1/auth/logout */
export async function logoutUser(req: Request, res: Response) {
  // Clear cookie if present; do not error if cookie-parser isn't wired yet
  try {
    res.clearCookie("refresh_token", {
      ...refreshCookieOptions,
      // clearCookie requires the same path/samesite/secure to match the original cookie
    });
  } catch {
    // ignore
  }

  // 204 No Content is typical for logout
  return res.status(204).send();
}

