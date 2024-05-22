module.exports = require('eslint-config-kagura').nonzzz({ ts: true, jsx: true, unusedImports: false }, {
  ignores: ['packages/**/output.js', 'packages/**/dist/*', 'packages/**/*.d.ts']
})
