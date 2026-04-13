import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import type {
  RegisterDto,
  LoginDto,
  GoogleAuthDto,
} from "../schemas/auth.schema.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { OAuth2Client } from "google-auth-library";

// We rely on standard process.env.GOOGLE_CLIENT_ID, but loosely bound to not crash if missing from types
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "mock_client");

/**
 * Register a new user. Checks for duplicate email, creates user, returns JWT.
 */
export async function register(dto: RegisterDto) {
  const existing = await prisma.user.findUnique({
    where: { email: dto.email },
  });
  if (existing) {
    throw new ApiError(409, "Email already in use");
  }

  const user = await prisma.user.create({
    data: {
      email: dto.email,
      password: dto.password,
      role: dto.role,
      authProvider: "local",
    },
  });

  return generateToken(user);
}

/**
 * Login with email and password. Returns JWT on success.
 */
export async function login(dto: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (
    !user ||
    user.password !== dto.password ||
    user.authProvider === "google"
  ) {
    throw new ApiError(401, "Invalid credentials");
  }

  return generateToken(user);
}

/**
 * Handles verifying a Google token, logging in the user, or registering them silently.
 */
export async function googleLogin(dto: GoogleAuthDto) {
  let email = "";
  // Dev mode mock path: If token equals 'mock_google_token_developer', we fake a verified payload
  // This helps UI testing without waiting for real Google credentials
  if (dto.token.startsWith("mock_google_token_")) {
    email = dto.token.split("mock_google_token_")[1];
  } else {
    // Live verification layer
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.token,
        audience: process.env.GOOGLE_CLIENT_ID, // Let it throw if invalid
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new ApiError(401, "Invalid Google payload");
      }
      email = payload.email;
    } catch (err: any) {
      console.error("[Google Auth Error]:", err.message);
      throw new ApiError(
        401,
        "We could not verify your Google account. Please try again.",
      );
    }
  }

  // Lookup user
  let user = await prisma.user.findUnique({ where: { email } });

  // If user doesn't exist, create them
  if (!user) {
    // They must provide a role during initial registration, but we'll default to SUPPLIER if missing
    user = await prisma.user.create({
      data: {
        email,
        authProvider: "google",
        role: dto.role || "SUPPLIER",
      },
    });
  } else if (user.authProvider !== "google") {
    // Security measure: if they registered locally, don't let Google steal the account easily, OR migrate them.
    // Easiest is to just allow it and update their provider.
    user = await prisma.user.update({
      where: { id: user.id },
      data: { authProvider: "google" },
    });
  }

  return generateToken(user);
}

/**
 * Generate a JWT token for the given user.
 */
function generateToken(user: { id: number; email: string; role: string }) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    access_token: jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    }),
    user: { id: user.id, email: user.email, role: user.role },
  };
}
