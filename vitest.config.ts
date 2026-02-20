// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    tsconfigPaths({
      projectDiscovery: 'lazy',
      logFile: true,
    }),
    react(),
  ],
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
        '.storybook',
        'node_modules/',
        'scripts/**',
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
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,next,nyc,cypress,tsup,build,tailwind,postcss,prettier,eslint,commitlint,playwright,stylelint,vitest.storybook}.config.*',
        '**/.{eslint,mocha,prettier}rc.{?(c|m)js,yml}',
        'env.mjs',
        'vitest.setup.ts',
        'src/stories/**',
      ],
    },
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '.next/**'],
  },
  build: {
    sourcemap: true,
  },
});
