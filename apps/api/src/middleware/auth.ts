import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    roleId?: string;
    committeeId?: string;
    tier: string;
  };
}

export const withAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing or invalid token" } });
  }

  const token = authHeader.split(" ")[1];
  try {
    const secret = process.env.JWT_SECRET || "default_secret";
    const decoded = jwt.verify(token, secret) as AuthRequest["user"];
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token expired or invalid" } });
  }
};

export const withRole = (...allowedTiers: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userTier = req.user?.tier;
    
    if (!userTier) {
      return res.status(403).json({ error: { code: "PERMISSION_DENIED", message: "No role assigned" } });
    }

    if (userTier === "MASTER") {
      return next(); // Master overrides
    }

    if (!allowedTiers.includes(userTier)) {
      return res.status(403).json({ error: { code: "PERMISSION_DENIED", message: "Insufficient tier permissions." } });
    }

    next();
  };
};
