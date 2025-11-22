import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config = createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  clearMocks: true,
});

export default config;
