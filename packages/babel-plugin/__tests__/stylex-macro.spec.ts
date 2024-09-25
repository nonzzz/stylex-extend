import path from 'path'

import { pluginTester } from 'babel-plugin-tester'
import plugin from '../src'

pluginTester({
  plugin,
  pluginName: 'stylex-extend',
  fixtures: path.join(__dirname, 'fixtures'),
  babelOptions: {
    parserOpts: {
      plugins: ['jsx']
    }
  }
})
