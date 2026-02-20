/* eslint-disable import/no-named-as-default-member */
// eslint.config.mjs
import fs from 'node:fs';

import eslint from '@eslint/js';
import eslintPluginNext from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { configs as storybookConfigs } from 'eslint-plugin-storybook';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

const repoRoot = import.meta.dirname;

function getDirectoriesToSort(rootDir) {
  const ignored = new Set(['.git', '.next', '.vscode', 'node_modules', 'dist', 'out', 'build', 'coverage', 'html']);

  try {
    return fs
      .readdirSync(rootDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((name) => !ignored.has(name));
  } catch {
    // Don’t let config-load-time FS issues break ESLint in editors/CI
    return [];
  }
}

const eslintIgnore = [
  '.git/**',
  '.next/**',
  'node_modules/**',
  'dist/**',
  'out/**',
  'build/**',
  'coverage/**',
  'html/**',
  '.agents/**',
  '**/*.min.js',
  '**/*.d.ts',
];

export default defineConfig(
  // ESLint v10: flat config only; .eslintignore is not used.
  // globalIgnores() makes "global ignores" explicit.
  globalIgnores(eslintIgnore),

  // Base JS rules (equivalent of eslint:recommended, but for flat config)
  eslint.configs.recommended,

  // Storybook
  ...storybookConfigs['flat/recommended'],

  // TypeScript (type-aware)
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Import plugin
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginImport.flatConfigs.typescript,

  // Catch unused eslint-disable comments
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  // Main ruleset
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: repoRoot,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      // Keep this key to match the rule names coming from eslintPluginNext.configs.*,
      // which are prefixed with "@next/next/..."
      '@next/next': eslintPluginNext,
      'jsx-a11y': jsxA11y,
      prettier,
      'unused-imports': unusedImports,

      // React + Hooks
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Next + a11y
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs['core-web-vitals'].rules,
      ...jsxA11y.configs.recommended.rules,

      // React + Hooks recommended
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Strict braces for all control statements (app + config + scripts)
      curly: ['error', 'all'],

      // Next.js / modern JSX transform
      'react/react-in-jsx-scope': 'off',

      // TS replaces prop-types
      'react/prop-types': 'off',

      // Unused imports cleanup
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Enforce interfaces for object shapes
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },

  // Settings + import sorting (applies globally)
  {
    settings: {
      'import/resolver': {
        // Requires: eslint-import-resolver-typescript
        typescript: {
          project: ['./tsconfig.json'],
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
          moduleDirectory: ['node_modules', 'src'],
        },
      },

      // Treat these as “core modules” (no resolution needed)
      'import/core-modules': ['geist/font/sans', 'geist/font/mono'],
    },
    rules: {
      // Let import/order handle declaration grouping; keep member sorting.
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],

      // builtin -> external -> internal -> parent -> sibling -> index
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            { pattern: '@/**', group: 'internal', position: 'after' },

            { pattern: 'env', group: 'internal', position: 'after' },
            { pattern: 'theme', group: 'internal', position: 'after' },

            ...getDirectoriesToSort(repoRoot).map((dir) => ({
              pattern: `${dir}/**`,
              group: 'internal',
              position: 'after',
            })),

            { pattern: 'public/**', group: 'internal', position: 'after' },

            // Styles last
            { pattern: '**/*.css', group: 'index', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // Storybook should be type-aware
  {
    files: ['.storybook/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.storybook.json'],
        tsconfigRootDir: repoRoot,
      },
    },
  },

  // Config/tooling files shouldn’t be type-aware
  {
    files: [
      '**/*.config.{js,cjs,mjs,ts}',
      'commitlint.config.{js,cjs,mjs,ts}',
      '**/eslint.config.{js,mjs,cjs,ts}',
      '**/vitest.config.{js,cjs,mjs,ts}',
      '**/vitest.*.config.{js,cjs,mjs,ts}',
      'scripts/**/*.{js,ts,mjs,cjs}',
    ],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      // ✅ turn off type-aware TS rules in non-type-aware files
      ...tseslint.configs.disableTypeChecked.rules,

      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-default-export': 'off',
    },
  },

  // Tests/stories can be a bit looser
  {
    files: [
      '**/*.{test,spec}.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/test/**/*.{js,jsx,ts,tsx}',
      '**/tests/**/*.{js,jsx,ts,tsx}',
      '**/*.stories.{js,jsx,ts,tsx}',
    ],
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Prettier conflict resolver must be last
  eslintConfigPrettier
);
