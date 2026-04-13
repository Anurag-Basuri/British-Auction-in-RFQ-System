import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";

import authRoutes from "./routes/auth.routes.js";
import rfqRoutes from "./routes/rfq.routes.js";
import bidRoutes from "./routes/bid.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

export const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: "*", credentials: true })); // In true production, origin should be strict

// DDoS Protection & Bruteforce prevention
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: {
    status: 429,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Observability Middlewares
app.use(pinoHttp({ logger }));
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.send("Hello World! British Auction API Online.");
});

// Route mounting
app.use("/auth", authRoutes);
app.use("/rfq", rfqRoutes);
app.use("/rfq", bidRoutes); // Handles /rfq/:rfqId/bid

// Centralized error handler MUST be the last middleware
app.use(errorHandler);
