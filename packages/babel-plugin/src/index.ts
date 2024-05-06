import * as b from '@babel/core'
import type { PluginObj } from '@babel/core'
import { scanImportStmt, transformInjectGlobalStyle, transformInline, transformStylexAttrs } from './visitor'
import { Context } from './state-context'
import type { StylexExtendBabelPluginOptions } from './interface'
import type { ImportIdentifiers, InternalPluginOptions } from './state-context'

const JSX_ATTRIBUTE_NAME = 'stylex'

const defaultOptions: InternalPluginOptions = {
  stylex: {
    helper: 'props'
  },
  enableInjectGlobalStyle: true,
  classNamePrefix: 'x',
  unstable_moduleResolution: {
    type: 'commonJS',
    rootDir: process.cwd(),
    themeFileExtension: '.stylex'
  },
  aliases: {}
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
          const pluginOptions = { ...defaultOptions, ...state.opts }
          if (typeof pluginOptions.stylex === 'boolean') {
            pluginOptions.stylex = { helper: pluginOptions.stylex ? 'props' : '' }
          }
          ctx.filename = state.filename || (state.file.opts?.sourceFileName ?? undefined)
          const body = path.get('body')
          const modules = ['create']
          if (pluginOptions.stylex.helper) modules.push(pluginOptions.stylex.helper)
          const identifiers = modules.reduce<ImportIdentifiers>((acc, cur) => ({ ...acc, [cur]: path.scope.generateUidIdentifier(cur) }), {})
          if (pluginOptions.stylex.helper) {
            const importSpecs = Object.values(identifiers).map((a, i) => t.importSpecifier(a, t.identifier(modules[i])))
            const importStmt = t.importDeclaration(importSpecs, t.stringLiteral('@stylexjs/stylex'))
            path.unshiftContainer('body', importStmt)
          }
          const anchor = body.findIndex(p => t.isImportDeclaration(p.node))
          ctx.setupOptions(pluginOptions, identifiers, anchor === -1 ? 0 : anchor)
          scanImportStmt(body, ctx)
          if (ctx.options.enableInjectGlobalStyle) {
            path.traverse({
              CallExpression(path) {
                const CSS = transformInjectGlobalStyle(path, ctx)
                if (CSS) {
                  Reflect.set(state.file.metadata, 'globalStyle', CSS)
                }
              }
            })
          }
          path.traverse({
            CallExpression(path) {
              const { arguments } = path.node
              // if (!arguments.length || arguments.find(a => a.type === 'CallExpression'))
              // if (path.get('arguments').length) {
              transformInline(path, ctx)
              path.skip()
            }
          })
        },
        exit(path) {
          const body = path.get('body')
          const anchor = ctx.anchor + ctx.lastBindingPos
          if (anchor !== -1 && ctx.stmts.length) body[anchor].insertAfter(ctx.stmts)
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

export type { StylexExtendBabelPluginOptions }
