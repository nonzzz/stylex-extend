import { NodePath, types } from '@babel/core'
import { Context } from '../state-context'
import { scanObjectExpression } from '../ast/evaluate-css'
import { callExpression, variableDeclaration } from '../ast/shared'

export function transformStylexAttrs(path: NodePath<types.JSXAttribute>, ctx: Context) {
  const value = path.get('value')
  if (!value.isJSXExpressionContainer()) return
  const { importIdentifiers, attach } = ctx
  const expression = value.get('expression')
  if (!expression.isObjectExpression()) throw new Error('[stylex-extend]: can\'t pass not object value for attribute \'stylex\'.')
  const result = scanObjectExpression(expression)
  if (result) {
    const [CSSAST, variable, expr] = result
    const stylexDeclaration = variableDeclaration(variable, callExpression(importIdentifiers.create, [CSSAST]))
    ctx.stmts.push(stylexDeclaration)
    path.replaceWith(types.jsxSpreadAttribute(callExpression(attach, expr)))
  }
}
