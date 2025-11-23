import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config = createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
    '^@adria/shared$': '<rootDir>/../shared/src/index.ts',
    '^@adria/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/../shared/src', '<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  clearMocks: true,
});

export default config;
