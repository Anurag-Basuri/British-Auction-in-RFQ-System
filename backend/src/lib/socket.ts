import { Server as SocketServer } from 'socket.io';
import type { Server } from 'http';

let io: SocketServer;

/**
 * Initialize the Socket.IO server and attach it to the HTTP server.
 * Sets up the `join-rfq` event for room-based broadcasting.
 */
export function initSocketServer(httpServer: Server) {
  io = new SocketServer(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('join-rfq', (rfqId: number) => {
      socket.join(`rfq-${rfqId}`);
    });
  });
}

/**
 * Broadcast an event to all clients subscribed to a specific RFQ room.
 */
export function broadcastToRfq(rfqId: number, event: string, payload: any) {
  io.to(`rfq-${rfqId}`).emit(event, payload);
}
