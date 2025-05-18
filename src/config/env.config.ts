export const EnvConfig = () => ({
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',

  // Environment IDs for header validation
  environmentIds: {
    development: process.env.ENV_ID_DEVELOPMENT || 'dev-default-id',
    qa: process.env.ENV_ID_QA || 'qa-default-id',
    production: process.env.ENV_ID_PRODUCTION || 'prod-default-id',
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'beyond_game_tcg',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_key',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    defaultAvatarUrl: process.env.DEFAULT_AVATAR_URL || 'https://res.cloudinary.com/teoisnotdead/image/upload/v1746931076/Beyond%20TCG/avatars/default_avatar.png',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
});
