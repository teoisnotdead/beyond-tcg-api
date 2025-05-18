import { SetMetadata } from '@nestjs/common';
import { HeaderConfig, Environment } from '../types/header.types';
import { BadRequestException } from '@nestjs/common';

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

/**
 * Decorador para requerir headers específicos de ambiente
 * @param environment - El ambiente que el frontend debe declarar
 * @returns Decorador que valida los headers de ambiente
 * 
 * @example
 * // El frontend debe enviar:
 * // x-environment: 'qa'
 * // x-environment-id: 'uuid-qa-environment'
 * @RequireEnvironment(Environment.QA)
 * async someEndpoint() { ... }
 */
export const RequireEnvironment = (environment: Environment) => RequireHeaders({
  'x-environment': { 
    required: true, 
    validate: (value) => {
      // Validar que el frontend envíe el ambiente correcto
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
      // El backend validará este ID contra sus variables de entorno
      // El frontend debe enviar el ID correcto para el ambiente actual
      return true; // La validación real se hace en HeadersService
    }
  },
});

// Predefined environment decorators
export const RequireDevelopmentEnvironment = () => RequireEnvironment(Environment.DEVELOPMENT);
export const RequireQAEnvironment = () => RequireEnvironment(Environment.QA);
export const RequireProductionEnvironment = () => RequireEnvironment(Environment.PRODUCTION); 