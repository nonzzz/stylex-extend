import * as b from '@babel/core'
import type { PluginObj, types } from '@babel/core'
import { createExtendMacro } from './extend-macro'
import { injectStylexHelper, transformStylexObjectExpression } from './stylex'
import type { StylexBindingMeta, StylexExtendBabelPluginOptions } from './interface'

const JSX_ATTRIBUTE_NAME = 'stylex'

const cssMacro = createExtendMacro('@stylex-extend/css')

interface PluginMacros {
  css: typeof cssMacro
  [prop: string]: any
}

type InternalPluginOptions = Omit<StylexExtendBabelPluginOptions, 'stylex'> & { stylex: StylexBindingMeta }

export interface State {
  pluginMacros: PluginMacros
  pluginOptions: InternalPluginOptions
  statements: types.VariableDeclaration[]
  helper: types.Identifier
}

const defaultOptions: InternalPluginOptions = {
  css: true,
  stylex: {
    helper: 'props'
  }
}

export const macros: PluginMacros = {
  css: cssMacro
}

function declare({ types: t }: typeof b): PluginObj<b.PluginPass & State> {
  return {
    name: '@stylex-extend',
    manipulateOptions(_, parserOpts) {
      // https://babeljs.io/docs/babel-plugin-syntax-jsx
      // https://github.com/babel/babel/blob/main/packages/babel-plugin-syntax-typescript/src/index.ts
      const { plugins } = parserOpts
      if (
        plugins.some((p: unknown) => {
          const plugin = Array.isArray(p) ? p[0] : p
          return plugin === 'typescript' || plugin === 'jsx'
        })
      ) {
        return
      }
      plugins.push('jsx')
    },
    visitor: {
      Program: {
        enter(path, state) {
          state.pluginMacros = this.pluginMacros
          state.pluginOptions = { ...defaultOptions, ...state.opts }
          state.statements = []
          if (typeof state.pluginOptions.stylex === 'boolean') {
            state.pluginOptions.stylex = { helper: state.pluginOptions.stylex ? 'props' : '' }
          }
          const helper = path.scope.generateUidIdentifier('stylexHelper')
          state.helper = helper
          path.unshiftContainer('body', injectStylexHelper(t, helper))
        },
        exit(path, state) {
          const body = path.get('body')
          const anchor = body.findLast(p => t.isImportDeclaration(p.node))
          if (anchor) {
            anchor.insertAfter(state.statements)
          }
        }
      },
      JSXAttribute(path, state) {
        if (path.node.name.name !== JSX_ATTRIBUTE_NAME || !state.pluginOptions.stylex.helper) {
          return
        }
        const value = path.get('value')
        if (value.isJSXExpressionContainer()) {
          if (t.isObjectExpression(value.node.expression)) {
            transformStylexObjectExpression(path, value.node.expression, state, t)
          }
        }
      }
    }
  }
}

function withOptions(options: Partial<StylexExtendBabelPluginOptions>) {
  return [declare, options]
}

declare.withOptions = withOptions

export type StylexExtendTransformObject = {
  (): PluginObj,
  withOptions: typeof withOptions
}

export default declare as unknown as StylexExtendTransformObject
