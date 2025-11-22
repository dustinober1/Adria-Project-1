"use strict";
// Shared constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS_HOURS = exports.SERVICES = exports.FILE_UPLOAD_LIMITS = exports.RATE_LIMITS = exports.JWT_EXPIRY = exports.PAGINATION_DEFAULTS = exports.API_BASE_PATH = exports.API_VERSION = void 0;
exports.API_VERSION = 'v1';
exports.API_BASE_PATH = `/api/${exports.API_VERSION}`;
exports.PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
};
exports.JWT_EXPIRY = '7d';
exports.RATE_LIMITS = {
    CONTACT_FORM: {
        MAX_REQUESTS: 3,
        WINDOW_MS: 60 * 60 * 1000, // 1 hour
    },
    API_DEFAULT: {
        MAX_REQUESTS: 100,
        WINDOW_MS: 60 * 1000, // 1 minute
    },
};
exports.FILE_UPLOAD_LIMITS = {
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
exports.SERVICES = {
    CLOSET_EDIT: 'closet-edit',
    WARDROBE_OVERHAUL: 'wardrobe-overhaul',
    ONE_EVENT_STYLING: 'one-event-styling',
    COLOR_ANALYSIS: 'color-analysis',
    PERSONAL_SHOPPING: 'personal-shopping',
};
exports.BUSINESS_HOURS = {
    START: '09:00',
    END: '18:00',
    TIMEZONE: 'America/Los_Angeles',
    BUFFER_MINUTES: 30,
};
//# sourceMappingURL=index.js.map