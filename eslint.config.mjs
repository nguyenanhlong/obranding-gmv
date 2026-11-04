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
    languageOptions: {
      globals: {
        React: 'readonly',
      },
    },
    rules: {
      // TypeScript đã lo việc này
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
        { type: 'feat-revenue', pattern: 'src/features/revenue/**' },
        { type: 'feat-orders', pattern: 'src/features/orders/**' },
        { type: 'feat-buyers', pattern: 'src/features/buyers/**' },
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
            { from: 'feat-revenue', allow: ['contracts', 'platform', 'feat-revenue'] },
            { from: 'feat-orders', allow: ['contracts', 'platform', 'feat-orders'] },
            { from: 'feat-buyers', allow: ['contracts', 'platform', 'feat-buyers'] },
            {
              from: 'app',
              allow: ['contracts', 'platform', 'feat-revenue', 'feat-orders', 'feat-buyers'],
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/fixture', '**/fixture.ts', '**/*.mock'],
              message:
                'Không import fixture/mock ngoài server/source.ts. Dùng queries.ts của slice.',
            },
          ],
        },
      ],
    },
  },

  // server layer được phép chạm mock + fixture
  {
    files: ['src/features/*/server/source.ts', 'src/features/*/server/*.mock.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // page/component không được tự đọc request (phải dùng parseFilters)
  {
    files: ['src/features/*/components/**/*.{ts,tsx}', 'src/platform/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['next/headers', '**/fixture', '**/fixture.ts', '**/*.mock'],
              message:
                'Component không đọc request trực tiếp. Nhận filters qua props từ layout.',
            },
          ],
        },
      ],
    },
  },
);
