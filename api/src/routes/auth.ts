import { Router } from "express";
const router = Router();
import { registerUser, loginUser, refreshToken, logoutUser } from "../controllers/authController";
import { schemas}  from "../spec/zod";
import { validateRequest } from "../middleware/validateRequest";

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
 *       required: [id, username, email, role]
 *       properties:
 *         id: { type: string, example: "vol_123" }
 *         username: { type: string, example: "alex" }
 *         email: { type: string, format: email, example: "alex@example.com" }
 *         role: { type: string, example: "VOLUNTEER" }
 *
 *     RegisterRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [username, email, password]
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
 *     RefreshRequest:
 *          type: object
 *          required: [refresh_token]
 *          properties:
 *              refresh_token:
 *                  type: string
 *
 *     AuthTokens:
 *       type: object
 *       required: [access_token, refresh_token, user]
 *       properties:
 *         access_token:
 *           type: string
 *           description: "JWT, ~15 minutes"
 *         refresh_token:
 *           type: string
 *           description: "JWT , ~30 days, stored in HttpOnly cookie"
 *         user:
 *           $ref: "#/components/schemas/UserPublic"
 * 
 *     TokenErrorResponse:
 *      type: object
 *      properties:
 *      message: { type: string, example: "Invalid or expired token" }
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message: { type: string, example: "Invalid credentials" }
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthTokens"
 *             examples:
 *               success:
 *                 value:
 *                   access_token: "eyJhbGciOi..."
 *                   refresh_token: "eyJhbGciOi..."
 *                   user:
 *                     id: "vol_123"
 *                     username: "alex"
 *                     email: "alex@example.com"
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
 *               $ref: "#/components/schemas/AuthTokens"
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *            $ref: "#/components/schemas/RefreshRequest"
 *     responses:
 *       200:
 *         description: New tokens issued (refresh should be rotated)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthTokens"
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

router.post("/register", validateRequest( {body: schemas.RegisterRequest}), registerUser);
router.post("/login", validateRequest({ body: schemas.LoginRequest}), loginUser);
router.post("/refresh", validateRequest({body: schemas.RefreshRequest}), refreshToken);
router.post("/logout", logoutUser);

export default router;