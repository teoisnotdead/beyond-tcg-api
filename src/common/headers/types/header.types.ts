export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile',
  ADMIN = 'admin',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  PRO = 'pro',
}

export enum Channel {
  WEB = 'web',
  MOBILE = 'mobile',
  API = 'api',
}

export interface HeaderValidationOptions {
  required?: boolean;
  validate?: (value: string) => boolean;
  transform?: (value: string) => any;
}

export interface HeaderConfig {
  [key: string]: HeaderValidationOptions;
}

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
} 