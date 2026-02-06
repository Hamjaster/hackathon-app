import type { Request, Response, NextFunction } from "express";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  
  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };
  
  if (now - record.lastReset > WINDOW_MS) {
    record.count = 0;
    record.lastReset = now;
  }
  
  record.count++;
  rateLimitMap.set(ip, record);
  
  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ message: "Too many requests. Please try again later." });
  }
  
  next();
}
