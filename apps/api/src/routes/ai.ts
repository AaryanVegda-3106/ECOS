import { Router } from "express";
import prisma from "../lib/prisma";
import { withAuth, AuthRequest } from "../middleware/auth";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

const isDummy = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy";

// Base templates for agents
const agentTemplates: Record<string, string> = {
  CONTENT: "You are the ECOS Content Writing Assistant for IEEE Student Branches. Help {role_name} draft professional content. Responsibilities: {responsibilities}.",
  DATA: "You are the ECOS Data Structuring Agent. Help {role_name} clean and restructure raw data. Responsibilities: {responsibilities}.",
  DRIVE: "You are the ECOS Drive Management Agent. Organize and tag Drive files for {role_name}. Responsibilities: {responsibilities}.",
  BUDGET: "You are the ECOS Budgeting Agent. Forecast and summarize budgets for {role_name}. Responsibilities: {responsibilities}.",
  MEDIA: "You are the ECOS Media Agent. Select the best media from Drive for {role_name}. Responsibilities: {responsibilities}.",
};

// Generic chat orchestration endpoint
router.post("/chat", withAuth, async (req: AuthRequest, res) => {
  try {
    const { message, agentType, taskId } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const aType = agentType || "CONTENT";
    const template = agentTemplates[aType] || agentTemplates["CONTENT"];

    // Fetch user context for context injection
    const userRole = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { role: true, committee: true }
    });

    const roleName = userRole?.role?.name || "Member";
    const responsibilities = userRole?.role?.responsibilities || "Assigned tasks";
    const systemPrompt = template
      .replace("{role_name}", roleName)
      .replace("{responsibilities}", Array.isArray(responsibilities) ? responsibilities.join(", ") : responsibilities)
      .replace("{committee_name}", userRole?.committee?.name || "IEEE SB");

    let contextNote = "";
    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: String(taskId) } });
      if (task) {
        contextNote = `Current task context: "${task.title}" — ${task.description || "No description"}`;
      }
    }

    let reply = "";
    if (isDummy) {
      // Mocked AI Response
      reply = `[MOCK AI - ${aType}] Hello ${roleName}! I received your request: "${message}". ` + 
              (contextNote ? `I see you're working on: ${contextNote}. ` : "") +
              `Since the OpenAI API key is missing, I am returning this placeholder response to simulate the AI behavior.`;
    } else {
      const messages = [
        { role: "system", content: `${systemPrompt}\n\n${contextNote}` },
        { role: "user", content: message }
      ];
      
      const completion = await openai.chat.completions.create({
         model: "gpt-4o-mini", // Fallback to a fast model
         messages: messages as any,
      });
      reply = completion.choices[0]?.message?.content || "No response generated.";
    }

    // Load or create session
    let session = await prisma.aiSession.findFirst({
      where: { userId: String(req.user?.id), agentType: aType, endedAt: null },
      orderBy: { startedAt: "desc" }
    });

    if (!session) {
      session = await prisma.aiSession.create({
        data: {
          userId: String(req.user?.id),
          agentType: aType,
          messages: JSON.stringify([
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
            { role: "assistant", content: reply }
          ])
        }
      });
    } else {
      const existing = JSON.parse(session.messages || "[]");
      existing.push({ role: "user", content: message });
      existing.push({ role: "assistant", content: reply });
      session = await prisma.aiSession.update({
        where: { id: session.id },
        data: { messages: JSON.stringify(existing) }
      });
    }

    res.json({ reply, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch sessions history
router.get("/sessions", withAuth, async (req: AuthRequest, res) => {
  try {
    const { agentType } = req.query;
    const where: any = { userId: String(req.user?.id) };
    if (agentType) where.agentType = String(agentType);

    const sessions = await prisma.aiSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
    });

    // Parse messages for frontend
    const data = sessions.map(s => ({
      ...s,
      messages: JSON.parse(s.messages || "[]")
    }));

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// End a session explicitly
router.post("/sessions/:id/end", withAuth, async (req: AuthRequest, res) => {
  try {
    const session = await prisma.aiSession.update({
      where: { id: String(req.params.id) },
      data: { endedAt: new Date() }
    });
    res.json({ data: session });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
  }
});

export default router;
