import type { ParserOptions, PluginObj } from '@babel/core'

import type { StylexExtendBabelPluginOptions } from '../interface'

export function declare(): PluginObj {
  return {
    name: 'stylex-extend-macro',
    manipulateOptions(_, parserOpts: ParserOptions) {
      if (!parserOpts.plugins) {
        parserOpts.plugins = []
      }
      const { plugins } = parserOpts
      if (
        plugins.some((p) => {
          const plugin = Array.isArray(p) ? p[0] : p
          return plugin === 'typescript' || plugin === 'jsx'
        })
      ) {
        return
      }
      plugins.push('jsx')
    },
    visitor: {}
  }
}

function withOptions(options: Partial<StylexExtendBabelPluginOptions>) {
  return [declare, options]
}

declare.withOptions = withOptions
