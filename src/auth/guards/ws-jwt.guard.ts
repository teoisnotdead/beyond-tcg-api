import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = client.handshake.query.token as string;
      
      if (!token) {
        throw new WsException('Token no proporcionado');
      }

      const payload = this.jwtService.verify(token);
      // Añadir el usuario al objeto de la solicitud
      client.data.user = payload;
      
      return true;
    } catch (err) {
      throw new WsException('Token inválido');
    }
  }
} 