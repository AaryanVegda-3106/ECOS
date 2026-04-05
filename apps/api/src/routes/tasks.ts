import { Router } from "express";
import prisma from "../lib/prisma";
import { withAuth, withRole, AuthRequest } from "../middleware/auth";

const router = Router();

// List tasks for a pipeline
router.get("/", withAuth, async (req: AuthRequest, res) => {
  try {
    const { pipelineId, status, assignedTo, priority } = req.query;

    const where: any = { deletedAt: null };
    if (pipelineId) where.pipelineId = String(pipelineId);
    if (status) where.status = String(status);
    if (assignedTo) where.assignedTo = String(assignedTo);
    if (priority) where.priority = String(priority);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        pipeline: { select: { id: true, title: true } },
        _count: { select: { comments: true, files: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ data: tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single task
router.get("/:id", withAuth, async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: String(req.params.id) },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        pipeline: { select: { id: true, title: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
        files: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ data: task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create task
router.post("/", withAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, pipelineId, assignedTo, priority, deadline, status } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        pipelineId,
        assignedTo: assignedTo || null,
        createdBy: req.user?.id || null,
        priority: priority || "MEDIUM",
        status: status || "TODO",
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { comments: true, files: true } },
      },
    });

    // Create notification for assignee
    if (assignedTo && assignedTo !== req.user?.id) {
      await prisma.notification.create({
        data: {
          senderId: req.user?.id || null,
          recipientId: assignedTo,
          committeeId: req.user?.committeeId || null,
          type: "TASK_ASSIGNED",
          scope: "PERSONAL",
          message: `You've been assigned to task: "${title}"`,
        },
      });
    }

    res.status(201).json({ data: task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update task
router.patch("/:id", withAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, status, priority, assignedTo, deadline } = req.body;
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    const task = await prisma.task.update({
      where: { id: String(req.params.id) },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { comments: true, files: true } },
      },
    });

    res.json({ data: task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Kanban move — update task status (drag-and-drop)
router.patch("/:id/move", withAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    const validStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const task = await prisma.task.update({
      where: { id: String(req.params.id) },
      data: { status },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { comments: true, files: true } },
      },
    });

    res.json({ data: task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Soft-delete task
router.delete("/:id", withAuth, async (req: AuthRequest, res) => {
  try {
    await prisma.task.update({
      where: { id: String(req.params.id) },
      data: { deletedAt: new Date() },
    });
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add comment to task
router.post("/:id/comments", withAuth, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const comment = await prisma.taskComment.create({
      data: {
        taskId: String(req.params.id),
        userId: req.user?.id || null,
        content,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ data: comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// List comments for a task
router.get("/:id/comments", withAuth, async (req: AuthRequest, res) => {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: String(req.params.id) },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ data: comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Attach file (Google Drive URL mapping)
router.post("/:id/files", withAuth, async (req: AuthRequest, res) => {
  try {
    const { fileName, fileUrl, mimeType } = req.body;
    if (!fileUrl) return res.status(400).json({ error: "fileUrl is required" });

    const file = await prisma.taskFile.create({
      data: {
        taskId: String(req.params.id),
        attachedBy: req.user?.id || null,
        fileName: fileName || "Untitled",
        fileUrl,
        mimeType: mimeType || "application/octet-stream",
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ data: file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Task stats (for dashboard)
router.get("/stats/overview", withAuth, async (req: AuthRequest, res) => {
  try {
    const committeeId = req.user?.committeeId;

    const baseWhere: any = { deletedAt: null };
    if (committeeId) {
      baseWhere.pipeline = { committeeId };
    }

    const [total, todo, inProgress, review, done, overdue] = await Promise.all([
      prisma.task.count({ where: baseWhere }),
      prisma.task.count({ where: { ...baseWhere, status: "TODO" } }),
      prisma.task.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...baseWhere, status: "REVIEW" } }),
      prisma.task.count({ where: { ...baseWhere, status: "DONE" } }),
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { not: "DONE" },
          deadline: { lt: new Date() },
        },
      }),
    ]);

    res.json({
      data: { total, todo, inProgress, review, done, overdue },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
