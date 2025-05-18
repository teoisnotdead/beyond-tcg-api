import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { HeaderConfig, ValidatedHeaders, Platform, Channel } from './types/header.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HeadersService {
  private readonly headerConfig: HeaderConfig = {
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

  constructor(private readonly configService: ConfigService) {}

  validateHeaders(headers: Record<string, string>): ValidatedHeaders {
    const validatedHeaders: Partial<ValidatedHeaders> = {};

    // Generar request-id si no existe
    if (!headers['x-request-id']) {
      headers['x-request-id'] = uuidv4();
    }

    // Validar headers requeridos y opcionales
    for (const [key, config] of Object.entries(this.headerConfig)) {
      const value = headers[key.toLowerCase()];

      if (config.required && !value) {
        throw new BadRequestException(`Header ${key} is required`);
      }

      if (value && config.validate && !config.validate(value)) {
        throw new BadRequestException(`Invalid value for header ${key}`);
      }

      if (value && config.transform) {
        validatedHeaders[key.replace('x-', '')] = config.transform(value);
      } else if (value) {
        validatedHeaders[key.replace('x-', '')] = value;
      }
    }

    // Validar API key si está presente
    if (validatedHeaders.apiKey && !this.validateApiKey(validatedHeaders.apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Validar client secret si está presente
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