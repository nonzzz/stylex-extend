import path from 'path'

import { pluginTester } from 'babel-plugin-tester'
import plugin from '../src'

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
