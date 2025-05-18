import { SetMetadata } from '@nestjs/common';
import { HeaderConfig } from '../types/header.types';

export const REQUIRE_HEADERS_KEY = 'requireHeaders';

export const RequireHeaders = (headers: Partial<HeaderConfig>) => {
  return SetMetadata(REQUIRE_HEADERS_KEY, headers);
};

// Predefined decorators for common use cases
export const RequireMobileHeaders = () => RequireHeaders({
  'x-platform': { required: true, validate: (value) => value === 'mobile' },
  'x-device-id': { required: true },
});

export const RequireAdminHeaders = () => RequireHeaders({
  'x-platform': { required: true, validate: (value) => value === 'admin' },
  'x-api-key': { required: true },
});

export const RequireSubscriptionHeaders = () => RequireHeaders({
  'x-subscription-tier': { required: true },
});

export const RequireCorrelationHeaders = () => RequireHeaders({
  'x-correlation-id': { required: true },
}); 