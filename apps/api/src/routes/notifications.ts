import { Router } from "express";
import prisma from "../lib/prisma";
import { withAuth, withRole, AuthRequest } from "../middleware/auth";

const router = Router();

// ── GET / — List notifications for current user ──────────────────
router.get("/", withAuth, async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientId: req.user?.id },
          { scope: "GLOBAL", committeeId: req.user?.committeeId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, role: { select: { name: true, tier: true } } } },
        recipient: { select: { id: true, name: true } },
      },
      orderBy: { sentAt: "desc" },
      take: 100,
    });
    res.json({ data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /unread-count ────────────────────────────────────────────
router.get("/unread-count", withAuth, async (req: AuthRequest, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        OR: [
          { recipientId: req.user?.id, isRead: false },
          { scope: "GLOBAL", committeeId: req.user?.committeeId, isRead: false },
        ],
      },
    });
    res.json({ data: { count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /send — Compose & send notification with tagging ─────
router.post("/send", withAuth, async (req: AuthRequest, res) => {
  try {
    const { recipientIds, message, scope } = req.body;
    const senderId = req.user?.id;
    const senderTier = req.user?.tier;
    const committeeId = req.user?.committeeId;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // RBAC enforcement
    const resolvedScope = scope || "INDIVIDUAL";

    if (resolvedScope === "GLOBAL" && !["MASTER", "LEADERSHIP"].includes(senderTier || "")) {
      return res.status(403).json({
        error: { code: "PERMISSION_DENIED", message: "Only MASTER and LEADERSHIP tiers can send global notifications." },
      });
    }

    const io = req.app.get("io");
    const created: any[] = [];

    if (resolvedScope === "GLOBAL") {
      // Send to ALL users in committee
      const users = await prisma.user.findMany({
        where: { committeeId: committeeId || undefined, isActive: true },
        select: { id: true },
      });

      for (const u of users) {
        if (u.id === senderId) continue; // Don't notify yourself
        const notif = await prisma.notification.create({
          data: {
            senderId,
            recipientId: u.id,
            committeeId,
            type: "ANNOUNCEMENT",
            scope: "GLOBAL",
            message: message.trim(),
          },
          include: { sender: { select: { id: true, name: true } } },
        });
        created.push(notif);

        // Real-time push
        if (io) {
          io.to(`user:${u.id}`).emit("notification:new", notif);
        }
      }
    } else {
      // Send to specific tagged users
      if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({ error: "recipientIds required for individual notifications" });
      }

      for (const recipientId of recipientIds) {
        if (recipientId === senderId) continue;
        const notif = await prisma.notification.create({
          data: {
            senderId,
            recipientId,
            committeeId,
            type: "ANNOUNCEMENT",
            scope: "INDIVIDUAL",
            message: message.trim(),
          },
          include: { sender: { select: { id: true, name: true } } },
        });
        created.push(notif);

        if (io) {
          io.to(`user:${recipientId}`).emit("notification:new", notif);
        }
      }
    }

    res.status(201).json({ data: created, count: created.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PATCH /:id/read — Mark single as read ────────────────────────
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

// ── PATCH /read-all — Mark all as read ───────────────────────────
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
