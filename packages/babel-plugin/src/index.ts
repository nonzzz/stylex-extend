import type { NodePath, PluginObj } from '@babel/core'
import { types } from '@babel/core'
import { ENABLED_PKGS, handleImportStmt } from './ast/handle-import'
import { MESSAGES } from './ast/message'
import { findNearestStatementAncestor, getStringLikeKindValue, isIdentifier, isTopLevelCalled } from './ast/shared'
import type { StylexExtendBabelPluginOptions } from './interface'
import type { ImportIdentifiers, InternalPluginOptions } from './state-context'
import { scanImportStmt, transformInjectGlobalStyle, transformInline, transformStylexAttrs } from './visitor'
import { EXTEND_INJECT_GLOBAL_STYLE, EXTEND_INLINE } from './visitor/import-stmt'
import { Module } from './module'
import { readImportStmt } from './visitor/imports'

function declare(): PluginObj {
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
          const mod = new Module(path, state)
          readImportStmt(path.get('body'), mod)
          path.traverse({
            JSXAttribute(path) {
              transformStylexAttrs(path, mod)
            },
            CallExpression(path) {
              transformInline(path, mod)
            }
          })
          // const pluginOptions = { ...defaultOptions, ...state.opts }
          // if (typeof pluginOptions.stylex === 'boolean') {
          //   pluginOptions.stylex = { helper: pluginOptions.stylex ? 'props' : '' }
          // }
          // ctx.filename = state.filename || (state.file.opts?.sourceFileName ?? undefined)
          // const body = path.get('body')
          // if (pluginOptions.stylex.helper) {
          //   const modules = ['create', pluginOptions.stylex.helper]
          //   const identifiers = modules.reduce<ImportIdentifiers>(
          //     (acc, cur) => ({ ...acc, [cur]: path.scope.generateUidIdentifier(cur) }),
          //     {}
          //   )
          //   ctx.setupOptions(pluginOptions, identifiers, modules)
          // }
          // if (ensureWithExtendPkg(body)) {
          //   scanImportStmt(body, ctx)
          //   if (ctx.options.enableInjectGlobalStyle) {
          //     path.traverse({
          //       CallExpression(path) {
          //         const callee = path.get('callee')
          //         if (isIdentifier(callee)) {
          //           const identifier = getStringLikeKindValue(callee)
          //           if (ctx.imports.get(identifier) === EXTEND_INJECT_GLOBAL_STYLE) {
          //             const nearestStmt = findNearestStatementAncestor(path)
          //             if (!isTopLevelCalled(nearestStmt)) {
          //               throw new Error(MESSAGES.ONLY_TOP_LEVEL_INJECT_GLOBAL_STYLE)
          //             }
          //             const CSS = transformInjectGlobalStyle(path, ctx)
          //             if (CSS) {
          //               Reflect.set(state.file.metadata, 'globalStyle', CSS)
          //             }
          //           }
          //         }
          //       }
          //     })
          //   }
          //   path.traverse({
          //     CallExpression(path) {
          //       const { arguments: args } = path.node
          //       if (!args.length) return
          //       const maybeHave = args.find(a =>
          //         a.type === 'CallExpression' && a.callee.type === 'Identifier' &&
          //         ctx.imports.get(getStringLikeKindValue(a.callee)) === EXTEND_INLINE
          //       )
          //       if (!maybeHave) return
          //       transformInline(path, ctx)
          //       path.skip()
          //     }
          //   })
          // }
        },
        exit(path) {
          // 
        }
        //   exit(path) {
        //     const body = path.get('body')
        //     handleImportStmt(body, (path) => {
        //       if (getStringLikeKindValue(path.get('source')) === ENABLED_PKGS.extend) {
        //         path.remove()
        //       }
        //     })
        //     if (ctx.stmts.length) {
        //       const { importIdentifiers: identifiers, modules } = ctx
        //       const importSpecs = Object.values(identifiers).map((a, i) => types.importSpecifier(a, types.identifier(modules[i])))
        //       const importStmt = types.importDeclaration(importSpecs, types.stringLiteral('@stylexjs/stylex'))
        //       path.unshiftContainer('body', ctx.stmts)
        //       path.unshiftContainer('body', importStmt)
        //     }
        //     ctx.stmts = []
        //   }
        // }
        // JSXAttribute(path) {
        //   if (path.node.name.name !== JSX_ATTRIBUTE_NAME || !ctx.enableStylex) return
        //   transformStylexAttrs(path, ctx)
        // }
      }
    }
  }
}

function withOptions(options: Partial<StylexExtendBabelPluginOptions>) {
  return [declare, options]
}

declare.withOptions = withOptions

export type StylexExtendTransformObject = {
  (): PluginObj
  withOptions: typeof withOptions
}

export default declare as unknown as StylexExtendTransformObject

export type { StylexExtendBabelPluginOptions }
