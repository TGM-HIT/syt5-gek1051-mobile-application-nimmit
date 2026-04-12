import { cloudflightAngularConfig } from '@cloudflight/eslint-plugin-angular';
import { includeIgnoreFile } from '@eslint/compat';
import { globalIgnores } from '@eslint/config-helpers';
import { dirname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const gitignorePath = normalize(resolve(directory, '.gitignore'));

export default [
  includeIgnoreFile(gitignorePath),
  ...cloudflightAngularConfig({
    rootDirectory: directory,
    tsConfigFiles: ['./tsconfig.app.json', './tsconfig.spec.json'],
  }),
  globalIgnores([
    "src/app/authentication/*",
    "src/app/services/shopping-list.service.spec.ts"
  ]),
  // Transitional overrides so the existing codebase can adopt Cloudflight rules incrementally.
  {
    rules: {
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@angular-eslint/template/button-has-type': 'off',
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'off',
      '@angular-eslint/template/no-inline-styles': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
      curly: 'off',
      'no-console': 'off',
      'no-lonely-if': 'off',
      'no-magic-numbers': 'off',
      'no-promise-executor-return': 'off',
    },
  },
];
