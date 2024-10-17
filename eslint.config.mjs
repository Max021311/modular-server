import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import standardConfig from 'eslint-config-standard';
import importPlugin from 'eslint-plugin-import';
import nPlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';

export default [
  {
    files: ['src/**/*.ts'], // Aplica la configuración a archivos .ts
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      n: nPlugin,
      promise: promisePlugin,
    },
    rules: {
      ...standardConfig.rules,
      ...tsPlugin.configs.recommended.rules,
      'no-console': 1
    },
  },
  {
    files: ['src/**/*.js'], // Aplica la configuración a archivos .js
    ignores: ['node_modules', 'dist'], // Ignora carpetas innecesarias
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    },
    plugins: {
      import: importPlugin,
      n: nPlugin,
      promise: promisePlugin,
    },
    rules: {
      ...standardConfig.rules,
      'no-console': 1
    }
  }
]
