// /api/src/middleware/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import * as tokens from "../services/tokenService"; // you already have this
import * as users from "../db/user";                 // findById

// Augment Express to include req.user
declare global {
  namespace Express {
    interface UserPayload {
      id: string;           // or number if your IDs are numeric
      email: string;
      role: string;
    }
    interface Request {
      user?: UserPayload;
    }
  }
}

export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1) Read access token (prefer Authorization header)
      const auth = req.header("Authorization");
      let token: string | undefined;

      if (auth?.startsWith("Bearer ")) {
        token = auth.slice("Bearer ".length).trim();
      } else if ((req as any).cookies?.access_token) {
        // If you use HttpOnly cookies instead of headers
        token = (req as any).cookies.access_token;
      }

      if (!token) {
        return res.status(401).json({ error: { code: 401, message: "Missing access token" } });
      }

      // 2) Verify token (should throw if invalid/expired)
      const payload = tokens.verifyAccess(token) as { sub?: string; email?: string; role?: string };
      if (!payload?.sub) {
        return res.status(401).json({ error: { code: 401, message: "Invalid access token" } });
      }

      // 3) (Optional) Load current user from DB to ensure still active & get fresh role
      const user = await users.findById(String(payload.sub));
      if (!user) {
        return res.status(401).json({ error: { code: 401, message: "User not found" } });
      }

      // 4) Attach to req for downstream handlers
      req.user = { id: String(user.id), email: user.email, role: user.role };

      return next();
    } catch (err) {
      return res.status(401).json({ error: { code: 401, message: "Unauthorized" } });
    }
  };
}
