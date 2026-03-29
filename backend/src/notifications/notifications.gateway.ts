import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationsGateway {
  @WebSocketServer()
  server!: Server;

  // Broadcast function for general updates within an RFQ context.
  broadcastToRfq(rfqId: number, event: string, payload: any) {
    this.server.to(`rfq-${rfqId}`).emit(event, payload);
  }

  @SubscribeMessage('join-rfq')
  handleJoinRfq(@MessageBody() rfqId: number, client: any) {
    client.join(`rfq-${rfqId}`);
    return { event: 'joined', rfqId };
  }
}
