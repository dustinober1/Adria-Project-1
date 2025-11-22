import {
  API_BASE_PATH,
  FILE_UPLOAD_LIMITS,
  JWT_EXPIRY,
  RATE_LIMITS,
} from '../constants';

describe('Shared constants', () => {
  it('exposes API base path with version', () => {
    expect(API_BASE_PATH).toBe('/api/v1');
  });

  it('sets reasonable JWT expiry', () => {
    expect(JWT_EXPIRY).toBe('7d');
  });

  it('limits file uploads by size, count, and type', () => {
    expect(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE).toBeGreaterThan(0);
    expect(FILE_UPLOAD_LIMITS.MAX_FILES).toBeGreaterThan(0);
    expect(FILE_UPLOAD_LIMITS.ALLOWED_TYPES).toContain('image/jpeg');
  });

  it('defines rate limits for API and contact form', () => {
    expect(RATE_LIMITS.CONTACT_FORM.MAX_REQUESTS).toBeGreaterThan(0);
    expect(RATE_LIMITS.API_DEFAULT.WINDOW_MS).toBeGreaterThan(0);
  });
});
