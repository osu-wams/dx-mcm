module.exports = {
  extends: ['airbnb-base', 'prettier', 'prettier/@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@src', './src'],
          ['@mocks', './mocks'],
        ],
        extensions: ['.js', '.ts', '.json'],
      },
      node: {
        extensions: ['.js', '.ts', '.d.ts'],
      },
    },
  },
  rules: {
    'import/extensions': 0,
    'no-console': 0,
    '@typescript-eslint/restrict-plus-operands': 'error',
  },
  overrides: [
    {
      files: ['**/__tests__/*', '**/__mocks__/*'],
      env: {
        jest: true,
      },
    },
  ],
};
