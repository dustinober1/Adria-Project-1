import { env } from '../config/env';
import { logger } from '../lib/logger';

export type RecaptchaVerification = {
  success: boolean;
  score?: number;
  action?: string;
  errors?: string[];
};

const RECAPTCHA_ENDPOINT =
  'https://www.google.com/recaptcha/api/siteverify';

const shouldBypassRecaptcha = (): boolean => {
  return (
    env.nodeEnv === 'test' ||
    process.env.RECAPTCHA_SKIP_VERIFY === 'true' ||
    (!env.recaptchaSecretKey && env.nodeEnv !== 'production')
  );
};

export async function verifyRecaptcha(
  token: string,
  remoteIp?: string
): Promise<RecaptchaVerification> {
  if (shouldBypassRecaptcha()) {
    return {
      success: true,
      score: 1,
      action: 'bypass',
    };
  }

  if (!env.recaptchaSecretKey) {
    logger.error('reCAPTCHA secret key is missing');
    return { success: false, errors: ['missing_secret'] };
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', env.recaptchaSecretKey);
    params.append('response', token);
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const response = await fetch(RECAPTCHA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      logger.warn('reCAPTCHA verification HTTP error', {
        status: response.status,
        statusText: response.statusText,
      });
      return { success: false, errors: ['recaptcha_http_error'] };
    }

    const data = (await response.json()) as {
      success: boolean;
      score?: number;
      action?: string;
      ['error-codes']?: string[];
    };

    const score = data.score ?? 0;
    const passed = data.success && score >= env.recaptchaMinScore;
    return {
      success: passed,
      score,
      action: data.action,
      errors: data['error-codes'],
    };
  } catch (error) {
    logger.error('reCAPTCHA verification failed', { error });
    return { success: false, errors: ['recaptcha_verification_failed'] };
  }
}
