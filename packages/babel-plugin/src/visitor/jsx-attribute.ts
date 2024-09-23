import { NodePath, types } from '@babel/core'
import { MESSAGES } from '../ast/message'
import { evaluateCSS, printJsAST } from '../ast/evaluate-path'
import { callExpression, findNearestParentWithCondition, isObjectExpression, variableDeclaration } from '../ast/shared'
import { Module } from '../module'

const X = 'stylex'

function validateJSXAtrributes(
  path: NodePath<types.JSXAttribute>,
  path2: NodePath<types.JSXEmptyExpression | types.Expression>
) {
  if (!isObjectExpression(path2)) throw new Error(MESSAGES.INVALID_ATTRS_KIND)
  const nearestOpeningElement = findNearestParentWithCondition(path, (p) => p.isJSXOpeningElement())
  if (!nearestOpeningElement) throw new Error(MESSAGES.INVALID_JSX_ELEMENT)
  const attrs = nearestOpeningElement.get('attributes').filter((p) => p.isJSXAttribute() && p.node.name.name === X)
  if (attrs.length > 1) throw new Error(MESSAGES.DUPLICATE_STYLEX_ATTR)
  return path2
}

export function transformStylexAttrs(path: NodePath<types.JSXAttribute>, mod: Module) {
  const { node } = path
  const value = path.get('value')
  if (node.name.name === X && value.isJSXExpressionContainer()) {
    const expr = validateJSXAtrributes(path, value.get('expression'))
    const { references, css } = evaluateCSS(expr, mod)
    printJsAST({ css, references }, expr, mod)
  }

  // if (!value.isJSXExpressionContainer()) return
  // const { importIdentifiers, attach } = ctx
  // const expression = value.get('expression')
  // if (!expression.isObjectExpression()) throw new Error(MESSAGES.INVALID_ATTRS_KIND)
  // // const result = scanObjectExpression(expression)
  // evaluatePath(expression, ctx)
  // if (result) {
  //   const [CSSAST, variable, expr] = result
  //   const stylexDeclaration = variableDeclaration(variable, callExpression(importIdentifiers.create, [CSSAST]))
  //   ctx.stmts.push(stylexDeclaration)
  //   path.replaceWith(types.jsxSpreadAttribute(callExpression(attach, expr)))
  // }
}
