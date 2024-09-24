// inline is same as stylex macros

import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { MESSAGES } from '../ast/message'
import { callExpression, isCallExpression, isIdentifier, isMemberExpression, isObjectExpression, variableDeclaration } from '../ast/shared'
import { Module } from '../module'
import { evaluateCSS, printJsAST } from '../ast/evaluate-path'
import { APIS } from './imports'

function validateInlineMacro(path: NodePath<types.Expression | types.ArgumentPlaceholder | types.SpreadElement>[]) {
  if (path.length > 1) throw new Error(MESSAGES.INLINE_ONLY_ONE_ARGUMENT)
  if (isObjectExpression(path[0])) {
    return path[0]
  }
  throw new Error(MESSAGES.INVALID_INLINE_ARGUMENT)
}

export function transformInline(path: NodePath<types.CallExpression>, mod: Module) {
  const expressions: types.Expression[][] = []
  const callees: NodePath<types.CallExpression>[] = []
  for (const arg of path.get('arguments')) {
    if (isCallExpression(arg)) {
      const callee = arg.get('callee')
      if (isIdentifier(callee) && mod.extendImports.has(callee.node.name)) {
        callees.push(arg) 
      }
      if (isMemberExpression(callee)) {
        const obj = callee.get('object')
        const prop = callee.get('property')
        if (isIdentifier(obj) && isIdentifier(prop)) {
          if (mod.extendImports.has(obj.node.name) && APIS.has(prop.node.name)) {
            callees.push(arg)
          }
        }
      }
    }
  }

  for (const callee of callees) {
    const calleeArgs = callee.get('arguments')
    const expr = validateInlineMacro(calleeArgs)
    const { references, css } = evaluateCSS(expr, mod)
    const printed = printJsAST({ css, references }, expr, mod)
    expressions.push(printed.expressions)
  }

  // 

  // const expressions: types.Expression[][] = []
  // for (const inlineCall of inlineCalles) {
  //   const calleeArgs = inlineCall.get('arguments')
  //   if (calleeArgs.length > 1) throw new Error(MESSAGES.INLINE_ONLY_ONE_ARGUMENT)
  //   const expression = calleeArgs[0]
  //   if (expression.isObjectExpression()) {
  //     const result = scanObjectExpression(expression)
  //     if (result) {
  //       const [CSSAST, variable, expr] = result
  //       const stylexDeclaration = variableDeclaration(variable, callExpression(ctx.importIdentifiers.create, [CSSAST]))
  //       ctx.stmts.push(stylexDeclaration)
  //       expressions.push(expr)
  //     }
  //   }
  // }
  // const finallExpression: types.Expression[] = []
  // for (let i = 0; i < args.length; i++) {
  //   const path = args[i]
  //   if (!path.isCallExpression()) {
  //     finallExpression.push(path.node)
  //   } else {
  //     const callee = path.get('callee')
  //     if (callee.isIdentifier() && ctx.imports.get(callee.node.name) === EXTEND_INLINE) {
  //       finallExpression.push(...(expressions.shift() ?? []))
  //     } else {
  //       finallExpression.push(path.node)
  //     }
  //   }
  // }
  // const nextCallExpression = callExpression(path.node.callee, finallExpression)
  // path.replaceWith(nextCallExpression)
}
