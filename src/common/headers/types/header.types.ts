/**
 * Supported platforms for the application
 */
export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile',
  ADMIN = 'admin',
}

/**
 * User roles in the system
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

/**
 * Subscription tiers available
 */
export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  PRO = 'pro',
}

/**
 * Communication channels
 */
export enum Channel {
  WEB = 'web',
  MOBILE = 'mobile',
  API = 'api',
}

/**
 * Available environments
 */
export enum Environment {
  DEVELOPMENT = 'development',
  QA = 'qa',
  PRODUCTION = 'production',
}

/**
 * Options for header validation
 */
export interface HeaderValidationOptions {
  required?: boolean;
  validate?: (value: string) => boolean;
  transform?: (value: string) => any;
}

/**
 * Configuration for header validation
 * Maps header names to their validation options
 */
export interface HeaderConfig {
  [key: string]: HeaderValidationOptions;
}

/**
 * Validated headers after processing
 * Contains all possible headers that can be validated
 */
export interface ValidatedHeaders {
  platform: Platform;
  clientVersion: string;
  deviceId?: string;
  appLanguage: string;
  requestId: string;
  correlationId?: string;
  userAgent: string;
  userRole?: UserRole;
  subscriptionTier?: SubscriptionTier;
  channel: Channel;
  apiKey?: string;
  clientSecret?: string;
  environmentId: string;  // UUID for environment validation
  environment: Environment;  // Current environment (development, qa, production)
} 