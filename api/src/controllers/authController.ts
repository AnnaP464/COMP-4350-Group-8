import type { Request, Response, NextFunction} from "express";
import * as authService from "../services/authService";

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


// cookies options for refresh token
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // set true when behind HTTPS
  sameSite: "lax" as const,
  path: "/v1/auth/refresh",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/** POST /v1/auth/register */
export async function registerUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json(user);
  } catch (err) {
    return next(err); // don’t format here
  }
}
  /*
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
  });*/

/** POST /v1/auth/login */
export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try { res.json(await authService.login(req.body)); }
  catch (err) { next(err);}
  /* const { email, password } = req.body ?? {};
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
  }); */
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  
  // Accept either cookie or body
  // NEED TO REMOVE BODY VERSION LATER FOR PRODUCTION
  const cookieToken = (req as any).cookies?.refresh_token;
  const bodyToken = (req.body as any)?.refresh_token;
  const oldRefreshToken = cookieToken ?? bodyToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  try {

    // Call service to verify, rotate, and issue new tokens
    const { access_token, refresh_token, user } = await authService.refresh(oldRefreshToken);

    // Try to set cookie (safe if cookie-parser not mounted yet)
    try {
      res.cookie("refresh_token", refresh_token, refreshCookieOptions);
    } catch {
      /* ignore if cookie middleware not present */
    }

    return res.status(200).json({
      access_token,
      refresh_token,
      user, // { email, username, role }
    });
  } catch (err) {
    return next(err); 
  }
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

