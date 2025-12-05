import type { Request, Response, NextFunction } from "express";
import * as tokens from "../services/tokenService"; // you already have this
import {users} from "../db/user";                 // findById

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
      console.log("[requireAuth] hit", req.method, req.originalUrl);
      const auth = req.header("Authorization");
      console.log("[requireAuth] Authorization:", auth ?? "(none)");

      let token: string | undefined;
      if (auth?.startsWith("Bearer ")) token = auth.slice("Bearer ".length).trim();
      else if ((req as any).cookies?.access_token) token = (req as any).cookies.access_token;

      if (!token) {
        console.log("[requireAuth] 401: missing token");
        return res.status(401).json({ error: { code: 401, message: "Missing access token" } });
      }

      let payload: any;
      try {
        payload = tokens.verifyAccess(token);
        console.log("[requireAuth] payload:", payload);
      } catch (e) {
        console.log("[requireAuth] 401: verifyAccess threw:", e);
        return res.status(401).json({ error: { code: 401, message: "Invalid/expired token" } });
      }

      const userId = String(payload?.sub ?? payload?.id ?? "");
      if (!userId) {
        console.log("[requireAuth] 401: no sub/id in payload");
        return res.status(401).json({ error: { code: 401, message: "Invalid access token" } });
      }

      let user;
      try {
        user = await users.findById(userId);
        console.log("[requireAuth] findById:", user ? "found" : "not found");
      } catch (e) {
        console.log("[requireAuth] DB error on findById:", e);
        return res.status(401).json({ error: { code: 401, message: "Unauthorized" } });
      }

      if (!user) {
        return res.status(401).json({ error: { code: 401, message: "User not found" } });
      }

      req.user = { id: String(user.id), email: user.email, role: user.role };
      console.log("[requireAuth] OK user:", req.user.id);
      return next();
    } catch (err) {
      console.log("[requireAuth] 401: unexpected error:", err);
      return res.status(401).json({ error: { code: 401, message: "Unauthorized" } });
    }
  };
}

