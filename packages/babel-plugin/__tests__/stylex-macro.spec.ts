import path from 'path'

import { describe, it } from 'node:test'
import { pluginTester } from 'babel-plugin-tester'
import plugin from '../src'

// @ts-expect-error
globalThis.it = it
// @ts-expect-error
globalThis.it.only = (...args) => it(args[0], { only: true }, args[1])
// @ts-expect-error
globalThis.describe = describe

pluginTester({
  plugin,
  pluginName: 'stylex-macro',
  fixtures: path.join(__dirname, 'fixtures', 'stylex-macro'),
  babelOptions: {
    parserOpts: {
      plugins: ['jsx']
    }
  }
})
