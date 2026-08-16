import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@nx-serverless-bff/api-contract': fromRoot('./libs/api-contract/src/index.ts'),
      '@nx-serverless-bff/other-service-client': fromRoot(
        './libs/other-service-client/src/index.ts',
      ),
    },
  },
  test: {
    coverage: {
      all: true,
      exclude: ['**/*.spec.ts', '**/generated.ts', '**/index.ts'],
      include: ['apps/**/src/**/*.ts', 'libs/**/src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    environment: 'node',
    globals: true,
    include: ['apps/**/*.spec.ts', 'libs/**/*.spec.ts'],
    restoreMocks: true,
  },
});
