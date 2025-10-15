import { makeAuthService } from "../services/authService";
import { makeAuthController } from "../controllers/authController";
import { makeAuthRouter } from "../routes/auth";

// concrete persistence adapters (your files)
import { users } from "../db/user";
import { sessions } from "../db/Session";

// 1) Build the service with its dependencies
const authService = makeAuthService({ users , sessions });

// 2) Build the controller with the service
const authController = makeAuthController(authService);

// 3) Build and export a ready-to-mount router
export const authRouter = makeAuthRouter(authController);