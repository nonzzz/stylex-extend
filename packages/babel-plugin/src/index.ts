import * as b from '@babel/core'
import type { PluginObj } from '@babel/core'
import { transformInjectGlobalStyle, transformStylexAttrs } from './visitor'
import { Context } from './state-context'
import type { StylexExtendBabelPluginOptions } from './interface'
import type { ImportIdentifiers, InternalPluginOptions } from './state-context'

const JSX_ATTRIBUTE_NAME = 'stylex'

const defaultOptions: InternalPluginOptions = {
  stylex: {
    helper: 'props'
  }
}

function declare({ types: t }: typeof b): PluginObj {
  const ctx = new Context()

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
          state.pluginOptions = { ...defaultOptions, ...state.opts }
          state.statements = []
          const pluginOptions = { ...defaultOptions, ...state.opts }
          if (typeof pluginOptions.stylex === 'boolean') {
            pluginOptions.stylex = { helper: pluginOptions.stylex ? 'props' : '' }
          }

          const body = path.get('body')
          for (const stmt of body) {
            if (stmt.isImportDeclaration()) {
              for (const decl of stmt.node.specifiers) {
                if (decl.type === 'ImportSpecifier') {
                  ctx.imports.add(decl.local.name)
                }
              }
            }
          }
          const modules = ['create']
          if (pluginOptions.stylex.helper) modules.push(pluginOptions.stylex.helper)
          const identifiers = modules.reduce<ImportIdentifiers>((acc, cur) => ({ ...acc, [cur]: path.scope.generateUidIdentifier(cur) }), {})
          const importSpecs = Object.values(identifiers).map((a, i) => t.importSpecifier(a, t.identifier(modules[i])))
          const importStmt = t.importDeclaration(importSpecs, t.stringLiteral('@stylexjs/stylex'))
          path.unshiftContainer('body', importStmt)
          const anchor = body.findIndex(p => t.isImportDeclaration(p.node))
          ctx.setupOptions(pluginOptions, identifiers, anchor === -1 ? 0 : anchor)
          path.traverse({
            CallExpression(path) {
              transformInjectGlobalStyle(path, ctx)
            }
          })
        },
        exit(path) {
          const body = path.get('body')
          const anchor = ctx.anchor + ctx.lastBindingPos
          if (anchor !== -1) body[anchor].insertAfter(ctx.stmts)
          ctx.stmts = []
        }
      },
      JSXAttribute(path) {
        if (path.node.name.name !== JSX_ATTRIBUTE_NAME || !ctx.enableStylex) return
        transformStylexAttrs(path, ctx)
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
