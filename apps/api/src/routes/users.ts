import { Router } from "express";
import prisma from "../lib/prisma";
import { withAuth, withRole, AuthRequest } from "../middleware/auth";

const router = Router();

// List users (All authenticated users for directory/notifications)
router.get("/", withAuth, async (req: AuthRequest, res) => {
  try {
    const committeeId = req.user?.committeeId;
    const users = await prisma.user.findMany({
      where: committeeId ? { committeeId } : undefined,
      include: { role: true }
    });
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update profile
router.patch("/:id", withAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.id !== req.params.id && req.user?.tier !== "MASTER") {
      return res.status(403).json({ error: "Permission Denied" });
    }
    const updated = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: req.body
    });
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
