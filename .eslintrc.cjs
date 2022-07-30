module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-underscore-dangle': [1, { allow: ['_id'] }],
    'import/extensions': [2, 'always'],
    'prefer-regex-literals': 'off'
    
  },
};
