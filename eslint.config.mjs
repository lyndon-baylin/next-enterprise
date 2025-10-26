import eslintPluginNext from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import eslintPluginStorybook from 'eslint-plugin-storybook';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

import fs from 'node:fs';

function getDirectoriesToSort() {
  const ignoredSortingDirectories = new Set(['.git', '.next', '.vscode', 'node_modules']);
  return fs
    .readdirSync(process.cwd())
    .filter((file) => fs.statSync(process.cwd() + '/' + file).isDirectory())
    .filter((f) => !ignoredSortingDirectories.has(f));
}

const eslintIgnore = [
  '.git/**',
  '.next/**',
  '.next/types/**',
  '.next/dev/types/**',
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

const eslintConfig = [
  {
    ignores: eslintIgnore,
  },

  // Storybook, Import, NextJS
  ...eslintPluginStorybook.configs['flat/recommended'],

  // ✅ Base + strict + stylistic configs
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  eslintPluginImport.flatConfigs.recommended,

  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.storybook.json'], // enable type-aware linting
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@next/next': eslintPluginNext,
      'jsx-a11y': jsxA11y,
      prettier: prettier,
      'unused-imports': unusedImports,
    },
    rules: {
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs['core-web-vitals'].rules,
      ...jsxA11y.configs.recommended.rules,

      // 🔥 unused imports cleanup
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
      // 🎨 Prettier integration
      'prettier/prettier': 'error',
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
      // This tells ESLint to treat these fonts as “core modules” (no resolution needed).
      'import/core-modules': ['geist/font/sans', 'geist/font/mono'],
    },
    rules: {
      'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],

      'import/order': [
        'warn',
        {
          groups: ['external', 'builtin', 'internal', 'sibling', 'parent', 'index'],
          pathGroups: [
            ...getDirectoriesToSort().map((dir) => ({
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

  // 🧹 Prettier conflict resolver
  eslintConfigPrettier,
];

export default eslintConfig;
