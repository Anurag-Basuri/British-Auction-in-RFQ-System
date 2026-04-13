import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
} from "../schemas/auth.schema.js";
import {
  registerController,
  loginController,
  googleAuthController,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", validate(registerSchema), registerController);
router.post("/login", validate(loginSchema), loginController);
router.post("/google", validate(googleAuthSchema), googleAuthController);

export default router;
