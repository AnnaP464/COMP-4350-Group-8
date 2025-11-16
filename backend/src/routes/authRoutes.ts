import { Router } from "express";
import { AuthController } from "../contracts/authController.contracts";
import { schemas}  from "../spec/zod";
import { validateRequest } from "../middleware/validateRequest";
import { requireAuth } from "../middleware/requireAuth";
import { users } from "../db/user";

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication & session endpoints
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     UserPublic:
 *       type: object
 *       required: [id, username, role]
 *       properties:
 *         id: { type: string, example: "vol_123" }
 *         username: { type: string, example: "alex" }
 *         role: { type: string, example: "VOLUNTEER" }
 *
 *     RegisterRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [username, email, password, role]
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 32
 *           example: "Noah123"
 *         email:
 *           type: string
 *           format: email
 *           example: "Noah@example.com"
 *         password:
 *           type: string
 *           minLength: 8
 *           description: "Min 8 chars. Recommend letters, numbers, symbols."
 *           example: "StrongPassword123!"
 *         role:
 *           type: string
 *           enum: [Volunteer, Organizer]
 *           example: "Volunteer"
 *  
 *
 *     LoginRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "Noah@example.com"
 *         password:
 *           type: string
 *           example: "HiddenPassword123!"
 * 
 *     RefreshResponse:
 *       type: object
 *       required: [access_token]
 *       properties:
 *          access_token: 
 *            type: string
 *            description: "New JWT, ~15 minutes"
 * 
 *
 *     LoginResponse:
 *       type: object
 *       required: [access_token, user]
 *       properties:
 *         access_token:
 *           type: string
 *           description: "JWT, ~15 minutes"
 *         user:
 *           $ref: "#/components/schemas/UserPublic"
 * 
 *     TokenErrorResponse:
 *       type: object
 *       properties:
 *          message: { type: string, example: "Invalid or expired token" }
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *          message: { type: string, example: "Invalid credentials" }
 */


/**
 * @swagger
 * /v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     description: |
 *       Creates a user with **username, email, password**.  
 *       Optionally send a verification email before enabling sensitive actions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/RegisterRequest"
 *     responses:
 *       201:
 *         description: Registered successfully
 *         headers:
 *           Set-Cookie:
 *            description: HttpOnly refresh token cookie
 *           schema:
 *             type: string
 *             example: refresh_token=eyJhbGciOi...; HttpOnly; Secure; SameSite=Strict; Path=/v1/auth/refresh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LoginResponse"
 *             examples:
 *               success:
 *                 value:
 *                   access_token: "eyJhbGciOi..."
 *                   user:
 *                     id: "vol_123"
 *                     username: "alex"
 *                     role: "VOLUNTEER"
 *       400:
 *         description: Invalid input (e.g., weak password, bad email)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ErrorResponse" }
 *       409:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ErrorResponse" }
 */

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/LoginRequest"
 *     responses:
 *       200:
 *         description: Login successful
 *       headers:
 *        Set-Cookie:
 *          description: HttpOnly refresh token cookie
 *          schema:
 *            type: string
 *            example: refresh_token=eyJhbGciOi...; HttpOnly; Secure; SameSite=Strict; Path=/v1/auth/refresh
 *          content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LoginResponse"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ErrorResponse" }
 *       401:
 *         description: Invalid credentials or unverified email
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ErrorResponse" }
 */


/**
 * @swagger
 * /v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using a refresh token
 *     parameters:
 *        - in: cookie
 *          name: refresh_token
 *          required: true
 *          schema:
 *              type: string
 *              description: "HttpOnly cookie containing the refresh token"
 *
 *     responses:
 *       200:
 *         description: New access token (and new refresh cookie)
 *         headers:
 *           Set-Cookie:
 *             description: New HttpOnly refresh token cookie
 *             schema:
 *               type: string
 *               example: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/v1/auth/refresh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RefreshResponse"
 *       401:
 *         description: Invalid/expired refresh token or reuse detected
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/TokenErrorResponse" }
 */

/**
 * @swagger
 * /v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (revoke current refresh token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logged out (no content)
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/TokenErrorResponse" }
 */


export function makeAuthRouter(ctrl: AuthController) {
  const r = Router();

    // Registration 
    r.post(
        "/register",
        validateRequest({ body: schemas.RegisterRequest }),
        ctrl.register,
    );

    // Login 
    r.post(
        "/login",
        validateRequest({ body: schemas.LoginRequest }),
        ctrl.login,
    );

    // Refresh (cookie middleware automatically parses cookies)
    r.post(
        "/refresh",
       // validateRequest({ body: schemas.RefreshRequest}), // body optional for now
        ctrl.refresh,
    );

    // “me” endpoint
    r.get(
        "/me", 
        requireAuth(), async (req, res) => {
        // req.user is set by requireAuth()
        const u = await users.findById(req.user!.id);
        if (!u) return res.status(404).json({ message: "User not found" });

        res.json({
            id: u.id,
            username: u.username, 
            email: u.email,
            role: u.role,
            createdAt: u.created_at,
        });
    });
    // r.get(
    //     "/v1/auth/me",
    //     //authenticate, // authenticate format of request
    //     ctrl.me,
    // );


    // Logout (authenticate to identify user)
    r.post(
        "/logout",
        ctrl.logout,
    );
  return r;
}
