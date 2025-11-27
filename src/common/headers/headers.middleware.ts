import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HeadersService } from './headers.service';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

@Injectable()
export class HeadersMiddleware implements NestMiddleware {
  constructor(private readonly headersService: HeadersService) { }

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Skip validation for Google OAuth routes
      if (req.originalUrl.includes('/auth/google')) {
        return next();
      }

      // Get the current endpoint handler
      const handler = (req as any).route?.stack?.[0]?.handle;

      const validatedHeaders = this.headersService.validateHeaders(
        req.headers as Record<string, string>,
        handler
      );

      // Add validated headers to request for later use
      req['validatedHeaders'] = validatedHeaders;

      // Add request-id to response
      res.setHeader('x-request-id', validatedHeaders.requestId);

      next();
    } catch (error) {
      next(error);
    }
  }
}