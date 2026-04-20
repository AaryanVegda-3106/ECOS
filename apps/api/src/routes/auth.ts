import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { withAuth, withRole, AuthRequest } from "../middleware/auth";

const router = Router();

// ── Login Rate Limiting ──────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; lockedUntil: number | null }>();
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 20 * 60 * 1000; // 20 minutes

function getAttemptInfo(email: string) {
  return loginAttempts.get(email) || { count: 0, lockedUntil: null };
}

function resetAttempts(email: string) {
  loginAttempts.delete(email);
}

function recordFailedAttempt(email: string) {
  const info = getAttemptInfo(email);
  info.count += 1;
  if (info.count >= MAX_ATTEMPTS) {
    info.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(email, info);
  return info;
}

// ── POST /login ──────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Check lockout
  const attemptInfo = getAttemptInfo(email);
  if (attemptInfo.lockedUntil && Date.now() < attemptInfo.lockedUntil) {
    const remainingMs = attemptInfo.lockedUntil - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return res.status(429).json({
      error: `Too many failed attempts. Try again in ${remainingMin} minute${remainingMin > 1 ? "s" : ""}.`,
      lockedUntil: attemptInfo.lockedUntil,
      remainingMs,
    });
  }

  // Clear expired lockout
  if (attemptInfo.lockedUntil && Date.now() >= attemptInfo.lockedUntil) {
    resetAttempts(email);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, committee: true },
    });

    if (!user || user.passwordHash !== password) {
      const info = recordFailedAttempt(email);
      const remaining = MAX_ATTEMPTS - info.count;

      if (info.lockedUntil) {
        return res.status(429).json({
          error: "Too many failed attempts. Try again in 20 minutes.",
          lockedUntil: info.lockedUntil,
          remainingMs: LOCKOUT_MS,
        });
      }

      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: remaining,
      });
    }

    // Success → reset attempts
    resetAttempts(email);

    const payload = {
      id: user.id,
      roleId: user.roleId,
      committeeId: user.committeeId,
      tier: user.role?.tier || "NONE",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── POST /bypass (Developer only) ───────────────────────────────
router.post("/bypass", async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { role: { name: "Developer" } },
      include: { role: true, committee: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Developer user not found" });
    }

    const payload = {
      id: user.id,
      roleId: user.roleId,
      committeeId: user.committeeId,
      tier: user.role?.tier || "NONE",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── POST /switch-role (MASTER only — impersonation) ─────────────
router.post("/switch-role", withAuth, withRole("MASTER"), async (req: AuthRequest, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: "targetUserId is required" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true, committee: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    const payload = {
      id: targetUser.id,
      roleId: targetUser.roleId,
      committeeId: targetUser.committeeId,
      tier: targetUser.role?.tier || "NONE",
      impersonatedBy: req.user?.id, // Track who is impersonating
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "15m" });

    return res.json({ token, user: targetUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── GET /me ─────────────────────────────────────────────────────
router.get("/me", withAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true, committee: true },
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
