import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HeadersService } from './headers.service';

@Injectable()
export class HeadersMiddleware implements NestMiddleware {
  constructor(private readonly headersService: HeadersService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedHeaders = this.headersService.validateHeaders(req.headers as Record<string, string>);
      
      // Agregar los headers validados al request para uso posterior
      req['validatedHeaders'] = validatedHeaders;
      
      // Agregar el request-id a la respuesta
      res.setHeader('x-request-id', validatedHeaders.requestId);
      
      next();
    } catch (error) {
      next(error);
    }
  }
} 