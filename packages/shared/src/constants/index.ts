// Shared constants

export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};

export const JWT_EXPIRY = '7d';

export const RATE_LIMITS = {
  CONTACT_FORM: {
    MAX_REQUESTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
  API_DEFAULT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
};

export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 10,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export const SERVICES = {
  CLOSET_EDIT: 'closet-edit',
  WARDROBE_OVERHAUL: 'wardrobe-overhaul',
  ONE_EVENT_STYLING: 'one-event-styling',
  COLOR_ANALYSIS: 'color-analysis',
  PERSONAL_SHOPPING: 'personal-shopping',
};

export const BUSINESS_HOURS = {
  START: '09:00',
  END: '18:00',
  TIMEZONE: 'America/Los_Angeles',
  BUFFER_MINUTES: 30,
};
