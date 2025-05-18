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
  ) {}

  async handleConnection(client: Socket) {
    try {
      // El token se enviará como query parameter
      const token = client.handshake.query.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      // Aquí deberías validar el token y obtener el userId
      // Por ahora, asumimos que el token es válido y contiene el userId
      const userId = token; // En producción, decodificar el JWT
      
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
    const userId = client.handshake.query.token as string;
    await this.notificationsService.markAsRead(data.notificationId, userId);
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    client.emit('unread_count', unreadCount);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_all_as_read')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.token as string;
    await this.notificationsService.markAllAsRead(userId);
    client.emit('unread_count', 0);
  }
} 