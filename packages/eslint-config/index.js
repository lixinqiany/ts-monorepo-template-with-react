import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export const createConfig = (rootDirectory, ...additionalConfigs) =>
  defineConfig(
    {
      ignores: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.dev/**',
        '**/.turbo/**',
        '**/.data/**',
        '**/coverage/**',
        '**/*.tsbuildinfo',
      ],
    },
    {
      linterOptions: {
        reportUnusedDisableDirectives: 'error',
        reportUnusedInlineConfigs: 'error',
      },
    },
    {
      files: ['**/*.{js,mjs,cjs,ts,tsx}'],
      rules: {
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        'no-var': 'error',
        'prefer-const': 'error',
        'array-callback-return': 'error',
        'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
      },
    },
    {
      files: ['**/*.{js,mjs,cjs}'],
      extends: [js.configs.recommended],
      languageOptions: { globals: globals.node },
    },
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
      ],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: rootDirectory,
        },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'all',
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        '@typescript-eslint/return-await': ['error', 'in-try-catch'],
        // TypeScript checks fallthrough and unreachable code for TS files.
        'no-fallthrough': 'off',
      },
    },
    {
      files: [
        'apps/server/**/*.ts',
        'packages/core/**/*.ts',
        'scripts/**/*.ts',
      ],
      languageOptions: { globals: globals.node },
    },
    {
      files: ['apps/server/**/*.spec.ts', 'apps/server/test/**/*.ts'],
      languageOptions: { globals: globals.vitest },
    },
    ...additionalConfigs,
    prettier,
  );
