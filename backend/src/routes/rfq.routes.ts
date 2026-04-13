import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createRfqSchema } from "../schemas/rfq.schema.js";
import {
  createRfqController,
  findAllRfqController,
  findOneRfqController,
} from "../controllers/rfq.controller.js";

const router = Router();

// All RFQ routes require authentication
router.use(authMiddleware);

router.post(
  "/",
  requireRole(["BUYER"]),
  validate(createRfqSchema),
  createRfqController,
);
router.get("/", findAllRfqController);
router.get("/:id", findOneRfqController);

export default router;
