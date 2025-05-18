import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ValidatedHeaders } from '../types/header.types';

export const ValidatedHeadersDecorator = createParamDecorator(
  (data: keyof ValidatedHeaders | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request['validatedHeaders'] as ValidatedHeaders;

    if (!headers) {
      throw new Error('Headers not validated. Make sure HeadersMiddleware is applied.');
    }

    return data ? headers[data] : headers;
  },
);

// Decoradores específicos para cada tipo de header
export const Platform = () => ValidatedHeadersDecorator('platform');
export const ClientVersion = () => ValidatedHeadersDecorator('clientVersion');
export const DeviceId = () => ValidatedHeadersDecorator('deviceId');
export const AppLanguage = () => ValidatedHeadersDecorator('appLanguage');
export const RequestId = () => ValidatedHeadersDecorator('requestId');
export const CorrelationId = () => ValidatedHeadersDecorator('correlationId');
export const UserRole = () => ValidatedHeadersDecorator('userRole');
export const SubscriptionTier = () => ValidatedHeadersDecorator('subscriptionTier');
export const Channel = () => ValidatedHeadersDecorator('channel'); 