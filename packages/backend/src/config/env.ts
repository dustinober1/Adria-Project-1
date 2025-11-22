import { config as loadEnv } from 'dotenv';

// Load environment variables from .env files once on startup
loadEnv();

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numberFromEnv(process.env.PORT, 3001),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/adria_dev',
  jwtSecret:
    process.env.JWT_SECRET ?? 'default-secret-change-in-production-please',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
  bcryptRounds: numberFromEnv(process.env.BCRYPT_ROUNDS, 10),
  rateLimitWindowMs: numberFromEnv(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: numberFromEnv(
    process.env.RATE_LIMIT_MAX_REQUESTS,
    100
  ),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:3001',
};

export type EnvConfig = typeof env;
