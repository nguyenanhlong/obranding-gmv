import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'docs/**',
      'tools/**',
      'next-env.d.ts',
      '**/*.config.{js,mjs,ts}',
      'vitest.config.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { React: 'readonly' } },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  // ---------------------------------------------------------------- ranh giới
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*', 'app/**/*'],
      'boundaries/elements': [
        { type: 'contracts', pattern: 'src/contracts/**' },
        { type: 'platform', pattern: 'src/platform/**' },
        { type: 'feat-growth', pattern: 'src/features/growth-overview/**' },
        { type: 'feat-period', pattern: 'src/features/period-detail/**' },
        { type: 'feat-buyer', pattern: 'src/features/buyer-detail/**' },
        { type: 'feat-seller', pattern: 'src/features/seller-detail/**' },
        { type: 'feat-order', pattern: 'src/features/order-detail/**' },
        { type: 'app', pattern: 'app/**' },
      ],
    },
    rules: {
      'boundaries/no-unknown': 'off',
      'boundaries/no-unknown-files': 'off',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'contracts', allow: [] },
            { from: 'platform', allow: ['contracts'] },
            { from: 'feat-growth', allow: ['contracts', 'platform', 'feat-growth'] },
            { from: 'feat-period', allow: ['contracts', 'platform', 'feat-period'] },
            { from: 'feat-buyer', allow: ['contracts', 'platform', 'feat-buyer'] },
            { from: 'feat-seller', allow: ['contracts', 'platform', 'feat-seller'] },
            { from: 'feat-order', allow: ['contracts', 'platform', 'feat-order'] },
            {
              from: 'app',
              allow: [
                'contracts',
                'platform',
                'feat-growth',
                'feat-period',
                'feat-buyer',
                'feat-seller',
                'feat-order',
              ],
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/mock/dataset', '**/*.mock'],
              message:
                'Không import dataset/mock ngoài server/source.ts hoặc server mock của chính slice.',
            },
          ],
        },
      ],
    },
  },

  // server layer được phép chạm mock
  {
    files: ['src/features/*/server/**'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // component không được đọc request trực tiếp
  {
    files: ['src/features/*/components/**/*.{ts,tsx}', 'src/platform/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['next/headers', '**/mock/dataset', '**/*.mock'],
              message: 'Component không đọc request và không chạm mock trực tiếp.',
            },
          ],
        },
      ],
    },
  },
  // mock dùng chung của platform cũng là server layer
  {
    files: ['src/platform/reports/*/mock.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
