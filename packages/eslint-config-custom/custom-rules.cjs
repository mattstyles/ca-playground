exports.rules = {
  'import/order': 'off',
  'prefer-template': 'off',
  eqeqeq: ['error', 'smart'],
  'no-bitwise': 'off',
  'object-shorthand': 'always',
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/array-type': 'off',
  '@typescript-eslint/non-nullable-type-assertion-style': 'off',
  '@typescript-eslint/unified-signatures': [
    'error',
    {
      ignoreDifferentlyNamedParameters: true,
    },
  ],

  // react
  'react/jsx-sort-props': 'off',
}
