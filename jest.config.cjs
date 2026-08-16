/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/libs'],
  testPathIgnorePatterns: ['/dist/'],
  moduleNameMapper: {
    '^@nx-serverless-bff/api-contract$': '<rootDir>/libs/api-contract/src/index.ts',
    '^@nx-serverless-bff/other-service-client$': '<rootDir>/libs/other-service-client/src/index.ts',
  },
  collectCoverageFrom: [
    'apps/**/src/**/*.ts',
    'libs/other-service-client/src/**/*.ts',
    '!**/*.d.ts',
    '!**/*.spec.ts',
    '!**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
