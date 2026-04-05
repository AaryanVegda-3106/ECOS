import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io("http://localhost:4000", {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
}

export function connectSocket(userId?: string, committeeId?: string) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  if (userId) s.emit("join:user", userId);
  if (committeeId) s.emit("join:committee", committeeId);
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
