import path from 'path'

import { pluginTester } from 'babel-plugin-tester'
import plugin from '../src'

pluginTester({
  plugin,
  pluginName: 'stylex-extend',
  fixtures: path.join(__dirname, 'fixtures2'),
  babelOptions: {
    parserOpts: {
      plugins: ['jsx']
    }
  }
})
