import eslintPluginNext from '@next/eslint-plugin-next';
import eslintPluginImport from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

import { getInternalDirs } from './utils/get-internal-dirs.mjs';

const eslintIgnore = [
  '.git/**',
  '.next/**',
  'node_modules/**',
  'dist/**',
  'out/**',
  'build/**',
  'coverage/**',
  'html/**',
  '*.min.js',
  '*.config.js',
  '*.config.ts',
  '*.config.mjs',
  '*.d.ts',
  'tsconfig*.json',
];

// Collect physical + alias dirs from tsconfig
const internalDirs = getInternalDirs();

const eslintConfig = [
  {
    ignores: eslintIgnore,
  },

  // ✅ Base + strict + stylistic configs
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Storybook, Import, NextJS
  // ...eslintPluginStorybook.configs['flat/recommended'],
  eslintPluginImport.flatConfigs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'], // enable type-aware linting
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@next/next': eslintPluginNext,
      'jsx-a11y': jsxA11y,
      prettier: prettier,
    },
    rules: {
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs['core-web-vitals'].rules,
      ...jsxA11y.configs.recommended.rules,
    },
  },

  {
    settings: {
      tailwindcss: {
        callees: ['classnames', 'clsx', 'ctl', 'cn', 'cva'],
      },

      'import/resolver': {
        typescript: true,
        node: {
          extensions: ['.js', '.ts', '.tsx'],
          moduleDirectory: ['node_modules', 'src'],
        },
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],

      'import/order': [
        'warn',
        {
          groups: ['external', 'builtin', 'internal', 'sibling', 'parent', 'index'],
          pathGroups: [
            ...internalDirs.map((dir) => ({
              pattern: `${dir}/**`,
              group: 'internal',
            })),
            {
              pattern: 'env',
              group: 'internal',
            },
            {
              pattern: 'theme',
              group: 'internal',
            },
            {
              pattern: 'public/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '**/*.css',
              group: 'index',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['internal'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // 🚨 Override: turn off type-aware "unsafe" rules for config files
  // This ensures that
  // - ESLint won't try to load `tsconfig.json` for non-typescript config file
  // - Type-aware rules like `await-thenable` are disabled where they don't apply.
  {
    files: ['*.config.{js,cjs,mjs,ts}', 'eslint.config.{js,mjs,cjs,ts}', 'tsconfig*.json'],
    languageOptions: {
      parserOptions: {
        project: null, // ⛔ disables type-aware linting
      },
    },
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/await-thenable': 'off', // ✅ turn off type-aware rule
    },
  },
];

export default eslintConfig;
