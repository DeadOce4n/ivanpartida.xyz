/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  extends: ['custom'],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
  },
};
