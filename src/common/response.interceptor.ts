import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Global response interceptor to standardize all API responses.
 * Success responses: { success: true, message, data }
 * Error responses: { success: false, message, error, statusCode }
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        try {
          // If the controller returns an object with message/data, use it. Otherwise, wrap it.
          if (data && typeof data === 'object' && ('message' in data || 'data' in data)) {
            const response = {
              success: true,
              ...data,
            };
            return response;
          }
          const response = {
            success: true,
            data,
          };
          return response;
        } catch (error) {
          throw error;
        }
      }),
      catchError((err) => {
        if (err instanceof HttpException) {
          const status = err.getStatus();
          const response = err.getResponse();
          let message = (typeof response === 'string') ? response : (response as any).message;
          if (Array.isArray(message)) message = message.join(', ');
          return throwError(() => ({
            success: false,
            message: message || 'An error occurred',
            error: err.name,
            statusCode: status,
          }));
        }
        // Unhandled errors
        return throwError(() => ({
          success: false,
          message: err.message || 'Internal server error',
          error: err.name || 'Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }));
      })
    );
  }
} 