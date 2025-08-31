import type { ParserOptions, PluginObj } from '@babel/core'

import type { StylexExtendBabelPluginOptions } from '../interface'

/// What's macro. macro means that its a basic plugin only do transformation

export function declare(): PluginObj {
  return {
    name: 'stylex-extend-macro',
    manipulateOptions(_, parserOpts: ParserOptions) {
      // https://babeljs.io/docs/babel-plugin-syntax-jsx
      // https://github.com/babel/babel/blob/main/packages/babel-plugin-syntax-typescript/src/index.ts
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
    visitor: {
      Program(path, state) {
      }
    }
  }
}

function withOptions(options: Partial<StylexExtendBabelPluginOptions>) {
  return [declare, options]
}

declare.withOptions = withOptions
