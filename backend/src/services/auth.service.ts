import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import type { RegisterDto, LoginDto } from '../schemas/auth.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

/**
 * Register a new user. Checks for duplicate email, creates user, returns JWT.
 */
export async function register(dto: RegisterDto) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }

  const user = await prisma.user.create({
    data: {
      email: dto.email,
      password: dto.password,
      role: dto.role,
    },
  });

  return generateToken(user);
}

/**
 * Login with email and password. Returns JWT on success.
 */
export async function login(dto: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user || user.password !== dto.password) {
    throw new ApiError(401, 'Invalid credentials');
  }

  return generateToken(user);
}

/**
 * Generate a JWT token for the given user.
 */
function generateToken(user: { id: number; email: string; role: string }) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    access_token: jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1d' }),
    user: { id: user.id, email: user.email, role: user.role },
  };
}
