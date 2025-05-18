import { SetMetadata, BadRequestException } from '@nestjs/common';
import { HeaderConfig, Environment } from '../types/header.types';

export const REQUIRE_HEADERS_KEY = 'requireHeaders';

/**
 * Decorator to require specific headers for an endpoint
 * @param headers - Header configuration to validate
 * @returns Decorator that enforces header validation
 */
export const RequireHeaders = (headers: Partial<HeaderConfig>) => {
  return SetMetadata(REQUIRE_HEADERS_KEY, headers);
};

/**
 * Predefined decorator for mobile endpoints
 * Requires platform and device ID headers
 */
export const RequireMobileHeaders = () => RequireHeaders({
  'x-platform': { required: true, validate: (value) => value === 'mobile' },
  'x-device-id': { required: true },
});

/**
 * Predefined decorator for admin endpoints
 * Requires platform and API key headers
 */
export const RequireAdminHeaders = () => RequireHeaders({
  'x-platform': { required: true, validate: (value) => value === 'admin' },
  'x-api-key': { required: true },
});

/**
 * Predefined decorator for subscription endpoints
 * Requires subscription tier header
 */
export const RequireSubscriptionHeaders = () => RequireHeaders({
  'x-subscription-tier': { required: true },
});

/**
 * Predefined decorator for endpoints requiring correlation ID
 * Requires correlation ID header for request tracing
 */
export const RequireCorrelationHeaders = () => RequireHeaders({
  'x-correlation-id': { required: true },
});

/**
 * Decorator to require specific environment headers
 * @param environment - The environment that the frontend must declare
 * @returns Decorator that validates environment headers
 * 
 * @example
 * // Frontend must send:
 * // x-environment: 'qa'
 * // x-environment-id: 'uuid-qa-environment'
 * @RequireEnvironment(Environment.QA)
 * async someEndpoint() { ... }
 */
export const RequireEnvironment = (environment: Environment) => RequireHeaders({
  'x-environment': { 
    required: true, 
    validate: (value) => {
      // Validate that frontend sends the correct environment
      const isValid = value === environment;
      if (!isValid) {
        throw new BadRequestException(
          `Invalid environment. Frontend must send '${environment}' for this endpoint`
        );
      }
      return true;
    }
  },
  'x-environment-id': { 
    required: true,
    validate: (value) => {
      // Backend will validate this ID against its environment variables
      // Frontend must send the correct ID for the current environment
      return true; // Actual validation is done in HeadersService
    }
  },
});

// Predefined environment decorators
export const RequireDevelopmentEnvironment = () => RequireEnvironment(Environment.DEVELOPMENT);
export const RequireQAEnvironment = () => RequireEnvironment(Environment.QA);
export const RequireProductionEnvironment = () => RequireEnvironment(Environment.PRODUCTION); 