import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// Make io accessible to routes
app.set("io", io);

import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import rolesRouter from "./routes/roles";
import pipelinesRouter from "./routes/pipelines";
import tasksRouter from "./routes/tasks";
import notificationsRouter from "./routes/notifications";
import aiRouter from "./routes/ai";

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/roles", rolesRouter);
app.use("/api/v1/pipelines", pipelinesRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/ai", aiRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Socket.io events
io.on("connection", (socket: any) => {
  console.log("Socket connected:", socket.id);

  // Join room based on user's committee
  socket.on("join:committee", (committeeId: string) => {
    socket.join(`committee:${committeeId}`);
    console.log(`Socket ${socket.id} joined committee:${committeeId}`);
  });

  // Join personal notification room
  socket.on("join:user", (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user:${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Export io for use in routes
export { io };

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
