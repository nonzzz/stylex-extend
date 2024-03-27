module.exports = require('eslint-config-kagura').nonzzz({ ts: true, react: true, jsx: true }, {
  ignores: ['packages/**/output.js'],
  rules: {
    'react/no-unknown-property': ['error', { ignore: ['stylex'] }]
  }
})
