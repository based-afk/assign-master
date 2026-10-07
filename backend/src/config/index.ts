import dotenv from 'dotenv';

dotenv.config();

// Strip any accidental leading/trailing quotes entered into cloud dashboard variables
const rawDbUrl = (process.env.DATABASE_URL || 'file:./dev.db').trim().replace(/^["']|["']$/g, '');
process.env.DATABASE_URL = rawDbUrl;

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: rawDbUrl,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev-only-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

