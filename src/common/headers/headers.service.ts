import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { HeaderConfig, ValidatedHeaders, Platform, Channel } from './types/header.types';
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
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

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

    return validatedHeaders as ValidatedHeaders;
  }

  private validateApiKey(apiKey: string): boolean {
    const validApiKeys = this.configService.get<string[]>('VALID_API_KEYS') || [];
    return validApiKeys.includes(apiKey);
  }

  private validateClientSecret(secret: string): boolean {
    const validSecrets = this.configService.get<string[]>('VALID_CLIENT_SECRETS') || [];
    return validSecrets.includes(secret);
  }
} 