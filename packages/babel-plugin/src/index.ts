import type { PluginObj } from '@babel/core'

import { createExtendMacro } from './extend-macro'

const cssMacro = createExtendMacro('@stylex-extend/css')

const reactMacro = createExtendMacro('@stylex-extend/react')

export default function declare(): PluginObj {
  return {
    name: '@stylex-extend',
    visitor: {
      Program: {
        enter: (path) => {
          // 
        }
      }
    }
  }
}
