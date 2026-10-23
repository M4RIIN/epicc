import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

function architectureRules(testImports = []) {
  return {
    '@nx/enforce-module-boundaries': [
      'error',
      {
        depConstraints: [
          {
            sourceTag: 'layer:domain',
            onlyDependOnLibsWithTags: [],
            allowedExternalImports: testImports,
          },
          {
            sourceTag: 'layer:application',
            onlyDependOnLibsWithTags: ['layer:domain'],
            allowedExternalImports: testImports,
          },
          {
            sourceTag: 'layer:infrastructure',
            onlyDependOnLibsWithTags: ['layer:domain', 'layer:application'],
            allowedExternalImports: testImports,
          },
          {
            sourceTag: 'layer:contracts',
            onlyDependOnLibsWithTags: [],
            allowedExternalImports: ['zod', ...testImports],
          },
          {
            sourceTag: 'layer:api',
            onlyDependOnLibsWithTags: [
              'layer:domain',
              'layer:application',
              'layer:infrastructure',
              'layer:contracts',
            ],
          },
          {
            sourceTag: 'layer:web',
            onlyDependOnLibsWithTags: ['layer:contracts'],
          },
        ],
      },
    ],
  };
}

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nx/**',
      '**/.react-router/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly' },
    },
    plugins: { '@nx': nx },
    rules: architectureRules(),
  },
  {
    files: ['**/*.test.ts'],
    rules: architectureRules(['vitest']),
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  prettier,
);
