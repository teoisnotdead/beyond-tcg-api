import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { NotificationsService } from './notifications.service';
import { forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especificar los orígenes permitidos
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // El token se enviará como query parameter
      const token = client.handshake.query.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token) as { sub?: string };
      const userId = payload?.sub;
      if (!userId) {
        client.disconnect();
        return;
      }
      
      // Unir al cliente a su sala personal
      await client.join(userId);
      
      // Enviar conteo de notificaciones no leídas
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unread_count', unreadCount);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Limpiar cualquier estado necesario
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userId = client.data?.user?.sub as string | undefined;
    if (!userId) {
      return;
    }
    await this.notificationsService.markAsRead(data.notificationId, userId);
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    client.emit('unread_count', unreadCount);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_all_as_read')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    const userId = client.data?.user?.sub as string | undefined;
    if (!userId) {
      return;
    }
    await this.notificationsService.markAllAsRead(userId);
    client.emit('unread_count', 0);
  }
} 
