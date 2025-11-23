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
  contactRateLimitMax: numberFromEnv(
    process.env.CONTACT_RATE_LIMIT_MAX,
    3
  ),
  contactRateLimitWindowMs: numberFromEnv(
    process.env.CONTACT_RATE_LIMIT_WINDOW_MS,
    60 * 60 * 1000
  ),
  formsRateLimitMax: numberFromEnv(
    process.env.FORMS_RATE_LIMIT_MAX,
    5
  ),
  formsRateLimitWindowMs: numberFromEnv(
    process.env.FORMS_RATE_LIMIT_WINDOW_MS,
    60 * 60 * 1000
  ),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:3001',
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY ?? '',
  recaptchaMinScore: (() => {
    const score = Number(process.env.RECAPTCHA_MIN_SCORE);
    return Number.isFinite(score) ? score : 0.5;
  })(),
  emailEnabled:
    (process.env.EMAIL_ENABLED ?? 'true').toLowerCase() === 'true',
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? '',
  sendgridFromEmail:
    process.env.SENDGRID_FROM_EMAIL ??
    process.env.FROM_EMAIL ??
    'noreply@adriacross.com',
  sendgridAdminEmail:
    process.env.SENDGRID_ADMIN_EMAIL ??
    process.env.ADMIN_EMAIL ??
    'admin@adriacross.com',
  sendgridReplyTo: process.env.SENDGRID_REPLY_TO ?? undefined,
  adminDashboardUrl:
    process.env.ADMIN_DASHBOARD_URL ?? 'http://localhost:3000/admin/inquiries',
  adminFormsUrl:
    process.env.ADMIN_FORMS_URL ?? 'http://localhost:3000/admin/forms',
};

export type EnvConfig = typeof env;
