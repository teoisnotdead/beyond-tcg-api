import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Error';

    // Known status map
    const statusMap: Record<number, { defaultMessage: string; defaultError: string }> = {
      400: { defaultMessage: 'Bad Request', defaultError: 'BadRequestException' },
      401: { defaultMessage: 'Unauthorized', defaultError: 'UnauthorizedException' },
      403: { defaultMessage: 'Forbidden', defaultError: 'ForbiddenException' },
      404: { defaultMessage: 'Not Found', defaultError: 'NotFoundException' },
      409: { defaultMessage: 'Conflict', defaultError: 'ConflictException' },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        error = (res as any).error || exception.name;
      }
    } else if (exception && typeof exception === 'object') {
      // Search for status in the exception object
      const possibleStatus = exception.statusCode || exception.status;
      if (possibleStatus && statusMap[possibleStatus]) {
        status = possibleStatus;
        message = exception.message || statusMap[possibleStatus].defaultMessage;
        error = exception.name || statusMap[possibleStatus].defaultError;
      }
    }

    if (Array.isArray(message)) message = message.join(', ');

    response.status(status).json({
      success: false,
      message,
      error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });

    if (status === 500) {
      console.error('Unhandled error in GlobalHttpExceptionFilter:', exception);
    }
  }
} 