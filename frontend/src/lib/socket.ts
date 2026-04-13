import { io, Socket } from "socket.io-client";

class SocketClient {
  private socket: Socket | null = null;
  private wsUrl: string;

  constructor() {
    this.wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";
  }

  public connect() {
    if (this.socket?.connected) return this.socket;

    // Use token if available
    let token = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("token");
    }

    this.socket = io(this.wsUrl, {
      auth: token ? { token } : undefined,
      reconnectionDelayMax: 10000,
    });

    this.socket.on("connect", () => {
      console.log("🔗 Real-time WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("🔴 WebSocket disconnected");
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  // Domain-specific helpers
  public joinRfqRoom(rfqId: number) {
    this.socket?.emit("join_rfq", rfqId);
  }

  public leaveRfqRoom(rfqId: number) {
    this.socket?.emit("leave_rfq", rfqId);
  }
}

// Export singleton instance natively
export const socketClient = new SocketClient();
