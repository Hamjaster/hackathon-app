import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "hackathon-jwt-secret-2026";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Middleware: parse Authorization Bearer token and set req.user.
 * Does not reject unauthenticated requests — use req.isAuthenticated() in route handlers.
 */
export function jwtAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    (req as any).user = null;
    (req as any).isAuthenticated = () => false;
    return next();
  }

  const payload = verifyToken(token);
  if (!payload?.userId) {
    (req as any).user = null;
    (req as any).isAuthenticated = () => false;
    return next();
  }

  (req as any).user = { id: payload.userId };
  (req as any).isAuthenticated = () => true;
  next();
}
