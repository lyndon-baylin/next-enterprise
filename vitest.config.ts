import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    reporters: ['default', 'html'],
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
    mockReset: true,
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      // This prevents Vitest from trying to read missing `.map` files
      // Clean coverage report on watch rerun
      cleanOnRerun: true,
      // Coverage score settings
      thresholds: {
        statements: 75, // % of all executable statements that were run during tests
        branches: 75, // % of all conditional branches (e.g. if, switch) that were tested
        functions: 75, // % of functions that were invoked
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
  },
  build: {
    sourcemap: true,
  },
});
