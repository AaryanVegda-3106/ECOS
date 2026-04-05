import { Router } from "express";
import prisma from "../lib/prisma";
import { withAuth, withRole, AuthRequest } from "../middleware/auth";

const router = Router();

// List pipelines (scoped to user's committee)
router.get("/", withAuth, async (req: AuthRequest, res) => {
  try {
    const committeeId = req.user?.committeeId;
    const pipelines = await prisma.pipeline.findMany({
      where: committeeId ? { committeeId } : undefined,
      include: {
        _count: { select: { tasks: true } },
        role: { select: { name: true, tier: true } },
        committee: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with task status counts
    const enriched = await Promise.all(
      pipelines.map(async (p) => {
        const statusCounts = await prisma.task.groupBy({
          by: ["status"],
          where: { pipelineId: p.id, deletedAt: null },
          _count: true,
        });
        return {
          ...p,
          statusCounts: statusCounts.reduce(
            (acc, s) => ({ ...acc, [s.status]: s._count }),
            {} as Record<string, number>
          ),
        };
      })
    );

    res.json({ data: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single pipeline
router.get("/:id", withAuth, async (req: AuthRequest, res) => {
  try {
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: String(req.params.id) },
      include: {
        role: { select: { name: true, tier: true } },
        committee: { select: { name: true } },
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true } },
            _count: { select: { comments: true, files: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!pipeline) {
      return res.status(404).json({ error: "Pipeline not found" });
    }

    res.json({ data: pipeline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create pipeline (LEADERSHIP+)
router.post("/", withAuth, withRole("LEADERSHIP", "MASTER"), async (req: AuthRequest, res) => {
  try {
    const { title, description, type, roleId } = req.body;
    const pipeline = await prisma.pipeline.create({
      data: {
        title,
        description,
        type: type || "GENERAL",
        committeeId: req.user?.committeeId || null,
        roleId: roleId || null,
      },
    });
    res.status(201).json({ data: pipeline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update pipeline
router.patch("/:id", withAuth, withRole("LEADERSHIP", "MASTER"), async (req: AuthRequest, res) => {
  try {
    const pipeline = await prisma.pipeline.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });
    res.json({ data: pipeline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete pipeline
router.delete("/:id", withAuth, withRole("MASTER"), async (req: AuthRequest, res) => {
  try {
    await prisma.pipeline.delete({
      where: { id: String(req.params.id) },
    });
    res.json({ message: "Pipeline deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
