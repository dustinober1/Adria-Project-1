"use strict";
// Shared utility functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.truncateText = exports.isValidPhoneNumber = exports.validateEmail = exports.formatCurrency = exports.slugify = void 0;
const slugify = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
const formatCurrency = (cents) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(cents / 100);
};
exports.formatCurrency = formatCurrency;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^\+?1?\d{10,14}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
};
exports.isValidPhoneNumber = isValidPhoneNumber;
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
};
exports.truncateText = truncateText;
const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.delay = delay;
//# sourceMappingURL=index.js.map