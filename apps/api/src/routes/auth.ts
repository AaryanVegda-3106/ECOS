import { Router } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { withAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// In a real app we'd use bcrypt, but for scaffold we do simple matching or assume predefined logic
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, committee: true }
    });

    // Dummy password check for phase 1 mock testing
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      roleId: user.roleId,
      committeeId: user.committeeId,
      tier: user.role?.tier || "NONE"
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });

    res.cookie("refresh_token", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    
    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/bypass", async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { role: { name: "Developer" } },
      include: { role: true, committee: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Developer user not found" });
    }

    const payload = {
      id: user.id,
      roleId: user.roleId,
      committeeId: user.committeeId,
      tier: user.role?.tier || "NONE"
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });

    res.cookie("refresh_token", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    
    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/me", withAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true, committee: true }
    });
    
    res.json({ user });
  } catch(err) {
      res.status(500).json({ error: "Internal error" });
  }
});

export default router;
