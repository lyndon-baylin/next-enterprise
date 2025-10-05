/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    reporters: ['default', 'html'],
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      // This prevents Vitest from trying to read missing `.map` files
      // Clean coverage report on watch rerun
      cleanOnRerun: true,
      // Coverage score settings
      thresholds: {
        statements: 75,
        // % of all executable statements that were run during tests
        branches: 75,
        // % of all conditional branches (e.g. if, switch) that were tested
        functions: 75,
        // % of functions that were invoked
        lines: 75, // % of lines of code that were executed
      },
      exclude: [
        '.next',
        'node_modules/',
        'test/**',
        'coverage/**',
        'html/**',
        'dist/**',
        'packages/*/test?(s)/**',
        '**/*.d.ts',
        'cypress/**',
        'test?(s)/**',
        'test?(-*).?(c|m)[jt]s?(x)',
        '**/*{.,-}{test,spec}.?(c|m)[jt]s?(x)',
        '**/__tests__/**',
        '**/e2e/**',
        '.next/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,tailwind,postcss,prettier}.config.*',
        '**/.{eslint,mocha,prettier}rc.{?(c|m)js,yml}',
        './vitest.setup.ts',
        './eslint.config.mjs',
        './prettier.config.mjs',
        './commitlint.config.mjs',
        './next.config.ts',
        './src/stories/**/*.{ts,ts,mdx}',
      ],
    },
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '.next/**'],
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
  build: {
    sourcemap: true,
  },
});
