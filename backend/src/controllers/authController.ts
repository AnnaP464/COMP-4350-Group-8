import type { RequestHandler } from "express";
import type { Request, Response, NextFunction} from "express";
import type { AuthService, RegisterInput, LoginInput} from "../contracts/auth.contracts";
import type { AuthController } from "../contracts/authController.contracts";

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
  role: "VOLUNTEER" | "ORGANZIER" | "ADMIN";
};

//END OF STUBS


// cookies options for refresh token
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // set true when behind HTTPS
  sameSite: "lax" as const, // change to "strict" if you we only want same site requests
  path: "/v1/auth/refresh",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};


// GET /v1/auth/me 
const me: RequestHandler = (_req, res) => {
  // TODO: if you have auth middleware attaching req.user, return it here
  return res.status(501).json({ message: "Not implemented" });
};



// Factory: take an AuthService, return Express handler.
export function makeAuthController(auth: AuthService) : AuthController {


    /** POST /v1/auth/register */
    async function registerUser(req: Request, res: Response, next: NextFunction) {
      try {

        // req.body has already been validated by middleware 
        // so we can confidently treat it as RegisterInput
        const { accessToken, refreshToken, user }  = await auth.register(req.body as RegisterInput);
        
        res.cookie("refresh_token", refreshToken, refreshCookieOptions);
        
        return res.status(201).json({
          access_token: accessToken,
          user,
        });
        
      } catch (err) {
        return next(err); // let the global error middleware format it
      }
    }

    /** POST /v1/auth/login */
    async function loginUser(req: Request, res: Response, next: NextFunction) {
      try {

        // req.body already validated by middleware → safe to cast
        const { accessToken, refreshToken, user } = await auth.login(req.body as LoginInput);

        // Set refresh token as HTTP-only cookie
        res.cookie("refresh_token", refreshToken, refreshCookieOptions);

        // Send access token + user only in JSON body
        return res.status(200).json({
          access_token: accessToken,
          user,
        });
      } catch (err) {
        return next(err);
      }
    }

    async function refreshToken(req: Request, res: Response, next: NextFunction) {
      
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
        const { accessToken, refreshToken } = await auth.refresh(oldRefreshToken);

        // Try to set cookie; don't error if cookie middleware not present
        try {
          res.cookie("refresh_token", refreshToken, refreshCookieOptions);
        } catch {
          /* ignore if cookie middleware not present */
        }

        return res.status(200).json({"access_token": accessToken});
      } catch (err) {
        return next(err); 
      }
    }

    //NEEDS TO PERSIST STILL 
    /** POST /v1/auth/logout */
    async function logoutUser(req: Request, res: Response) {
        // Clear cookie if present; do not error if cookie-parser isn't wired yet
        try 
        {
          res.clearCookie("refresh_token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/v1/auth/refresh",
          });
          return res.status(204).send();
        } catch {
          // ignore
      }
      // 204 No Content is typical for logout
      return res.status(204).send();
    }

    return {
      register: registerUser,
      login: loginUser,
      refresh: refreshToken,
      logout: logoutUser,
      me,
    };
}


