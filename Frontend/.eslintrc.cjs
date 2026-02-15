module.exports = {
  root: true,
  extends: ['@react-native'],
  ignorePatterns: ['node_modules/', 'android/', 'ios/', '.expo/', 'index.js'],
  rules: {
    'prettier/prettier': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-trailing-spaces': 'off',
    'react-native/no-inline-styles': 'off',
    'react/no-unstable-nested-components': 'off',
    'comma-dangle': 'off',
    curly: 'off',
    quotes: 'off',
  },
};
