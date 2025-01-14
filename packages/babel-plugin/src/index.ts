import type { ParserOptions, PluginObj } from '@babel/core'
import { isImportDeclaration } from './ast/shared'
import type { StylexExtendBabelPluginOptions } from './interface'
import { Module } from './module'
import type { PluginPass } from './module'
import { transformId, transformInjectGlobalStyle, transformInline, transformStylexAttrs } from './visitor'
import { FIELD, readImportStmt } from './visitor/imports'

function declare(): PluginObj {
  return {
    name: '@stylex-extend',
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
      Program: {
        enter(path, state) {
          const mod = new Module(path, state as PluginPass)
          readImportStmt(path.get('body'), mod)
          path.traverse({
            JSXAttribute(path) {
              transformStylexAttrs(path, mod)
            },
            CallExpression(path) {
              transformId(path, mod)
              transformInline(path, mod)
              transformInjectGlobalStyle(path, mod)
            }
          })
        },
        exit(path) {
          const body = path.get('body')
          for (const stmt of body) {
            if (isImportDeclaration(stmt)) {
              const s = stmt.get('source')
              if (s.isStringLiteral() && s.node.value === FIELD) {
                stmt.remove()
              }
            }
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

export type { StylexExtendBabelPluginOptions }
