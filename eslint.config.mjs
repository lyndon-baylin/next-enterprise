import fs from 'node:fs';

import eslintPluginNext from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { configs as storybookConfigs } from 'eslint-plugin-storybook';
import unusedImports from 'eslint-plugin-unused-imports';
import { configs as tsConfigs } from 'typescript-eslint';

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

  '**/*.min.js',
  '**/*.d.ts',
];

const eslintConfig = [
  { ignores: eslintIgnore },

  // Storybook
  ...storybookConfigs['flat/recommended'],

  // TypeScript (type-aware)
  ...tsConfigs.recommended,
  ...tsConfigs.strictTypeChecked,
  ...tsConfigs.stylisticTypeChecked,

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
      '@next/next': eslintPluginNext,
      'jsx-a11y': jsxA11y,
      prettier,
      'unused-imports': unusedImports,

      // ✅ React + Hooks
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

      // ✅ Strict braces for all control statements (app + config + scripts)
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

      // enforce interfaces for object shapes
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },

  // Settings + import sorting
  {
    settings: {
      // If you're not using eslint-plugin-tailwindcss, this is harmless but optional.
      // Note: Enable this line once a v4 support of `eslint-plugin-tailwindcss` reaches stable version
      // tailwindcss: {
      //   callees: ['classnames', 'clsx', 'ctl', 'cn', 'cva'],
      // },

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

      // ✅ Ideal order for Next + TS + @/* alias:
      // builtin -> external -> internal (@/...) -> parent -> sibling -> index -> css last
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            // Your TS alias
            { pattern: '@/**', group: 'internal', position: 'after' },

            // Keep if you import these directly as modules
            { pattern: 'env', group: 'internal', position: 'after' },
            { pattern: 'theme', group: 'internal', position: 'after' },

            // Treat repo-root folders as internal (safe + anchored)
            ...getDirectoriesToSort(repoRoot).map((dir) => ({
              pattern: `${dir}/**`,
              group: 'internal',
              position: 'after',
            })),

            { pattern: 'public/**', group: 'internal', position: 'after' },

            // Styles last
            { pattern: '**/*.css', group: 'index', position: 'after' },
          ],

          // Don’t exclude internal; it defeats your internal pathGroups.
          pathGroupsExcludedImportTypes: ['builtin'],

          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // ✅ Storybook should be type-aware (you enabled strictTypeChecked globally)
  {
    files: ['.storybook/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.storybook.json'],
        tsconfigRootDir: repoRoot,
      },
    },
  },

  // Override: config files shouldn’t be type-aware
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
        project: null, // ⛔ disables type-aware linting for these
      },
    },
    rules: {
      // ✅ turn off type-aware TS rules in non-type-aware files
      ...tsConfigs.disableTypeChecked.rules,

      // --- Tiny, pragmatic relaxations for tooling code ---
      'no-console': 'off', // configs/scripts often log intentionally
      '@typescript-eslint/no-require-imports': 'off', // some tooling still uses require()

      // If you use eslint-plugin-import rule `import/no-default-export`, config files often default export
      // (Only matters if you enable that rule elsewhere)
      'import/no-default-export': 'off',
    },
  },

  // ✅ Override: tests can be a bit looser without weakening app code
  {
    files: [
      '**/*.{test,spec}.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/test/**/*.{js,jsx,ts,tsx}',
      '**/tests/**/*.{js,jsx,ts,tsx}',
      '**/*.stories.{js,jsx,ts,tsx}',
    ],
    rules: {
      // Often too noisy in tests where effects are mocked or deps are intentional
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Prettier conflict resolver must be last
  eslintConfigPrettier,
];

export default eslintConfig;
