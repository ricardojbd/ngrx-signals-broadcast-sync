const nx = require('@nx/eslint-plugin');
const tsResolver = require('eslint-import-resolver-typescript');
const eslintPluginImportX = require('eslint-plugin-import-x');

module.exports = [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  eslintPluginImportX.flatConfigs.typescript,
  eslintPluginImportX.flatConfigs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    settings: {
      'import-x/resolver': {
        name: 'tsResolver',
        resolver: tsResolver
      }
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*']
            }
          ]
        }
      ],
      'import-x/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            ['internal', 'parent', 'sibling', 'index']
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ]
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {}
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': ['error', { ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs}'] }]
    },
    languageOptions: { parser: require('jsonc-eslint-parser') }
  },
  {
    files: ['**/*'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  }
];
