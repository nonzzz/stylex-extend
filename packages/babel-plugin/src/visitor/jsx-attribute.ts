import { NodePath, types } from '@babel/core'
import { MESSAGES } from '../ast/message'
import { evaluateCSS, printJsAST } from '../ast/evaluate-path'
import { callExpression, findNearestParentWithCondition, isObjectExpression, isTopLevelCalled, make } from '../ast/shared'
import { Module } from '../module'
import { insertRelativePackage } from './imports'

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
    const { properties, expressions, into } = printJsAST({ css, references }, expr)
    const [create, applied] = insertRelativePackage(mod.program, mod)
    const declaration = make.variableDeclaration(into, callExpression(create.node, [make.objectExpression(properties)]))
    const nearest = findNearestParentWithCondition(path, (p) => isTopLevelCalled(p))
    nearest.insertBefore(declaration)
    path.replaceWith(types.jsxSpreadAttribute(callExpression(applied.node, expressions)))
  }
}
