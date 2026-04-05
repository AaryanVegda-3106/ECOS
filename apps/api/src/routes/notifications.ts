import { Router } from "express";
import prisma from "../lib/prisma";
import { withAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// List notifications for authenticated user
router.get("/", withAuth, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user?.id },
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { sentAt: "desc" },
      take: 50,
    });
    res.json({ data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Unread count
router.get("/unread-count", withAuth, async (req: AuthRequest, res) => {
  try {
    const count = await prisma.notification.count({
      where: { recipientId: req.user?.id, isRead: false },
    });
    res.json({ data: { count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark single notification as read
router.patch("/:id/read", withAuth, async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: String(req.params.id) },
      data: { isRead: true },
    });
    res.json({ data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark all notifications as read
router.patch("/read-all", withAuth, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user?.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
