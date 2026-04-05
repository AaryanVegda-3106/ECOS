import { Router } from "express";
import prisma from "../lib/prisma";
import { withAuth, withRole } from "../middleware/auth";

const router = Router();

// List Roles (All Authenticated users)
router.get("/", withAuth, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: { committee: true }
    });
    res.json({ data: roles });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Create role (Master Only)
router.post("/", withAuth, withRole("MASTER"), async (req, res) => {
  try {
    const role = await prisma.role.create({
      data: req.body
    });
    res.json({ data: role });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
