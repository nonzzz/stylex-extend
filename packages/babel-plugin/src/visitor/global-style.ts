// API InjectGlobalStyle
// syntax: injectGlobalStyle()

import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import type { Context } from '../state-context'
import { createCSSContext, scanObjectExpression } from './jsx-attribute'

export function transformInjectGlobalStyle(path: NodePath<types.CallExpression>, ctx: Context) {
  const { node } = path
  if (!node || node.callee.type !== 'Identifier' || !ctx.imports.has(node.callee.name)) return
  const args = path.get('arguments')
  if (args.length > 1) throw new Error(`[stylex-extend]: ${node.callee.name} only accept one argument`)
  if (!args[0].isObjectExpression()) throw new Error('[stylex-extend]: can\'t pass not object value for attribute \'stylex\'.')
  const { anchor } = ctx
  const expression = args[0]
  const CSSContext = createCSSContext(expression.node.properties.length, anchor)
  scanObjectExpression(expression, CSSContext)
  console.log(CSSContext.rules)
}
