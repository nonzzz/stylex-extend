module.exports = require('eslint-config-kagura').nonzzz({ ts: true, jsx: true }, {
  ignores: ['packages/**/output.js', 'packages/**/dist/*', 'packages/**/*.d.ts']
})
