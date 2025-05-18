import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { HeaderConfig, ValidatedHeaders, Platform, Channel, Environment } from './types/header.types';
import { ConfigService } from '@nestjs/config';
import { REQUIRE_HEADERS_KEY } from './decorators/require-headers.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class HeadersService {
  private readonly defaultHeaderConfig: HeaderConfig = {
    'x-platform': {
      required: true,
      validate: (value) => Object.values(Platform).includes(value as Platform),
    },
    'x-client-version': {
      required: true,
      validate: (value) => /^\d+\.\d+\.\d+$/.test(value),
    },
    'x-device-id': {
      required: false,
      validate: (value) => /^[a-zA-Z0-9-_]+$/.test(value),
    },
    'x-app-language': {
      required: true,
      validate: (value) => /^[a-z]{2}(-[A-Z]{2})?$/.test(value),
    },
    'x-request-id': {
      required: false,
    },
    'x-correlation-id': {
      required: false,
      validate: (value) => /^[a-zA-Z0-9-_]+$/.test(value),
    },
    'x-user-role': {
      required: false,
    },
    'x-subscription-tier': {
      required: false,
    },
    'x-channel': {
      required: true,
      validate: (value) => Object.values(Channel).includes(value as Channel),
    },
    'x-api-key': {
      required: false,
      validate: (value) => this.validateApiKey(value),
    },
    'x-client-secret': {
      required: false,
      validate: (value) => this.validateClientSecret(value),
    },
    'x-environment-id': {
      required: true,
      validate: (value) => this.validateEnvironmentId(value),
    },
    'x-environment': {
      required: true,
      validate: (value) => Object.values(Environment).includes(value as Environment),
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Validates all headers according to the configuration
   * @param headers - Request headers to validate
   * @param handler - Optional handler for endpoint-specific validation
   * @returns Validated headers object
   * @throws BadRequestException if validation fails
   */
  validateHeaders(headers: Record<string, string>, handler?: any): ValidatedHeaders {
    const validatedHeaders: Partial<ValidatedHeaders> = {};
    
    // Get endpoint-specific configuration if it exists
    const endpointHeaders = handler ? 
      this.reflector.get<Partial<HeaderConfig>>(REQUIRE_HEADERS_KEY, handler) : 
      undefined;

    // Combine default configuration with endpoint-specific one
    const headerConfig = endpointHeaders ? 
      { ...this.defaultHeaderConfig, ...endpointHeaders } : 
      this.defaultHeaderConfig;

    // Generate request-id if it doesn't exist
    if (!headers['x-request-id']) {
      headers['x-request-id'] = uuidv4();
    }

    // Validate required and optional headers
    for (const [key, config] of Object.entries(headerConfig)) {
      // Ensure config exists
      if (!config) continue;

      const value = headers[key.toLowerCase()];

      // Validate if required
      if (config.required && !value) {
        throw new BadRequestException(`Header ${key} is required`);
      }

      // If value exists, validate format
      if (value && config.validate) {
        try {
          const isValid = config.validate(value);
          if (!isValid) {
            throw new BadRequestException(`Invalid value for header ${key}`);
          }
        } catch (error) {
          throw new BadRequestException(`Error validating header ${key}: ${error.message}`);
        }
      }

      // Transform or assign the value
      if (value) {
        try {
          if (config.transform) {
            validatedHeaders[key.replace('x-', '')] = config.transform(value);
          } else {
            validatedHeaders[key.replace('x-', '')] = value;
          }
        } catch (error) {
          throw new BadRequestException(`Error processing header ${key}: ${error.message}`);
        }
      }
    }

    // Validate API key if present
    if (validatedHeaders.apiKey && !this.validateApiKey(validatedHeaders.apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Validate client secret if present
    if (validatedHeaders.clientSecret && !this.validateClientSecret(validatedHeaders.clientSecret)) {
      throw new UnauthorizedException('Invalid client secret');
    }

    // Ensure environment headers are present before validation
    if (!validatedHeaders.environmentId || !validatedHeaders.environment) {
      throw new BadRequestException('Environment headers are required');
    }

    // Validate environment ID matches current environment
    if (!this.validateEnvironmentMatch(validatedHeaders.environmentId, validatedHeaders.environment)) {
      throw new UnauthorizedException('Environment ID does not match current environment');
    }

    return validatedHeaders as ValidatedHeaders;
  }

  /**
   * Validates the API key against configured valid keys
   * @param apiKey - API key to validate
   * @returns boolean indicating if the key is valid
   */
  private validateApiKey(apiKey: string): boolean {
    const validApiKeys = this.configService.get<string[]>('VALID_API_KEYS') || [];
    return validApiKeys.includes(apiKey);
  }

  /**
   * Validates the client secret against configured valid secrets
   * @param secret - Client secret to validate
   * @returns boolean indicating if the secret is valid
   */
  private validateClientSecret(secret: string): boolean {
    const validSecrets = this.configService.get<string[]>('VALID_CLIENT_SECRETS') || [];
    return validSecrets.includes(secret);
  }

  /**
   * Validates that the environment ID sent by the frontend is valid
   * @param envId - Environment ID to validate
   * @returns boolean indicating if the ID is valid
   */
  private validateEnvironmentId(envId: string): boolean {
    // Get environment IDs from configuration
    const validEnvIds = this.configService.get('environmentIds');
    
    if (!validEnvIds) {
      throw new Error('Environment IDs not configured in backend');
    }

    // Check if the ID sent by frontend matches any configured ID
    return Object.values(validEnvIds).includes(envId);
  }

  /**
   * Validates that the environment ID matches the declared environment
   * @param envId - Environment ID sent by frontend
   * @param environment - Environment declared by frontend
   * @returns boolean indicating if the match is valid
   * @throws UnauthorizedException if the ID doesn't match
   */
  private validateEnvironmentMatch(envId: string, environment: Environment): boolean {
    // Get expected environment ID from configuration
    const validEnvIds = this.configService.get('environmentIds');
    const expectedEnvId = validEnvIds?.[environment.toLowerCase()];

    if (!expectedEnvId) {
      throw new Error(`Environment ID not configured in backend for ${environment}`);
    }

    // Validate that the ID sent by frontend matches the expected one
    const isValid = envId === expectedEnvId;
    
    if (!isValid) {
      throw new UnauthorizedException(
        `Invalid environment ID for ${environment}. ` +
        'The frontend must send the correct environment ID for the current environment.'
      );
    }

    return true;
  }
} 