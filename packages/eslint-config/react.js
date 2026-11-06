import react from '@eslint-react/eslint-plugin';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export const reactConfig = defineConfig(
  {
    files: ['apps/web/vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat.recommended],
    plugins: { '@eslint-react': react },
    rules: {
      '@eslint-react/no-missing-key': 'error',
      '@eslint-react/no-duplicate-key': 'error',
      '@eslint-react/no-array-index-key': 'error',
      '@eslint-react/jsx-no-children-prop-with-children': 'error',
      '@eslint-react/jsx-no-comment-textnodes': 'error',
    },
  },
  {
    files: ['apps/web/src/**/*.tsx', 'packages/ui/**/*.tsx'],
    extends: [reactRefresh.configs.vite],
    rules: {
      '@eslint-react/dom-no-dangerously-set-innerhtml-with-children': 'error',
      '@eslint-react/dom-no-void-elements-with-children': 'error',
      '@eslint-react/dom-no-script-url': 'error',
      '@eslint-react/dom-no-unsafe-iframe-sandbox': 'error',
    },
  },
);
