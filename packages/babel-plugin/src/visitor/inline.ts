// inline is same as stylex macros

import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { Context } from '../state-context'
import { scanObjectExpression } from '../ast/evaluate-css'
import { callExpression, variableDeclaration } from '../ast/shared'
import { MESSAGES } from '../ast/message'

function pickupAllInlineMacro(args: NodePath<types.Expression>[], ctx: Context) {
  const result: NodePath<types.CallExpression>[] = []
  for (const arg of args) {
    if (arg.isCallExpression()) {
      const callee = arg.get('callee')
      if (callee.isIdentifier() && ctx.imports.has(callee.node.name)) {
        result.push(arg)
      }
    }
  }
  return result
}

export function transformInline(path: NodePath<types.CallExpression>, ctx: Context) {
  const args = path.get('arguments') as NodePath<types.Expression>[]
  const inlineCalles = pickupAllInlineMacro(args, ctx)
  const expressions: types.Expression[][] = []
  for (const inlineCall of inlineCalles) {
    const calleeArgs = inlineCall.get('arguments')
    if (calleeArgs.length > 1) throw new Error(MESSAGES.INLINE_ONLY_ONE_ARGUMENT)
    const expression = calleeArgs[0]
    if (expression.isObjectExpression()) {
      const result = scanObjectExpression(expression)
      if (result) {
        const [CSSAST, variable, expr] = result
        const stylexDeclaration = variableDeclaration(variable, callExpression(ctx.importIdentifiers.create, [CSSAST]))
        ctx.stmts.push(stylexDeclaration)
        expressions.push(expr)
      }
    }
  }
  const finallExpression: types.Expression[] = []
  for (let i = 0; i < args.length; i++) {
    const path = args[i]
    if (!path.isCallExpression()) {
      finallExpression.push(path.node)
    } else {
      const callee = path.get('callee')
      if (callee.isIdentifier() && ctx.imports.has(callee.node.name)) {
        finallExpression.push(...(expressions.shift() ?? []))
      } else {
        finallExpression.push(path.node)
      }
    }
  }
  const nextCallExpression = callExpression(path.node.callee, finallExpression)
  path.replaceWith(nextCallExpression)
}
