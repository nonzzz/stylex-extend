import { NodePath, types } from '@babel/core'
import { scanObjectExpression } from '../ast/evaluate-css'
import { MESSAGES } from '../ast/message'
import { callExpression, variableDeclaration } from '../ast/shared'
import { Context } from '../state-context'

export function transformStylexAttrs(path: NodePath<types.JSXAttribute>, ctx: Context) {
  const value = path.get('value')
  if (!value.isJSXExpressionContainer()) return
  const { importIdentifiers, attach } = ctx
  const expression = value.get('expression')
  if (!expression.isObjectExpression()) throw new Error(MESSAGES.INVALID_ATTRS_KIND)
  const result = scanObjectExpression(expression)
  if (result) {
    const [CSSAST, variable, expr] = result
    const stylexDeclaration = variableDeclaration(variable, callExpression(importIdentifiers.create, [CSSAST]))
    ctx.stmts.push(stylexDeclaration)
    path.replaceWith(types.jsxSpreadAttribute(callExpression(attach, expr)))
  }
}
