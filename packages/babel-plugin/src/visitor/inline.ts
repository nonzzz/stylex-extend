// inline is same as stylex macros

import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { evaluateCSS, printJsAST } from '../ast/evaluate-path'
import { MESSAGES } from '../ast/message'
import { callExpression, findNearestTopLevelAncestor, isIdentifier, isMemberExpression, isObjectExpression, make } from '../ast/shared'
import { Module } from '../module'
import { APIS, insertRelativePackage } from './imports'

function validateInlineMacro(path: NodePath<types.Expression | types.ArgumentPlaceholder | types.SpreadElement>[]) {
  if (path.length > 1) { throw new Error(MESSAGES.INLINE_ONLY_ONE_ARGUMENT) }
  if (isObjectExpression(path[0])) {
    return path[0]
  }
  throw new Error(MESSAGES.INVALID_INLINE_ARGUMENT)
}

export function getExtendMacro(path: NodePath<types.CallExpression>, mod: Module, expected: 'inline' | 'injectGlobalStyle') {
  if (!path.node) { return }
  const callee = path.get('callee')
  if (isIdentifier(callee) && mod.extendImports.get(callee.node.name) === expected) {
    path.skip()
    return path
  }
  if (isMemberExpression(callee)) {
    const obj = callee.get('object')
    const prop = callee.get('property')
    if (isIdentifier(obj) && isIdentifier(prop)) {
      if (mod.extendImports.has(obj.node.name) && APIS.has(prop.node.name) && prop.node.name === expected) {
        path.skip()
        return path
      }
    }
  }
}

function insertAndReplace(
  path: NodePath<types.CallExpression>,
  mod: Module,
  handler: (p: NodePath<types.CallExpression>, applied: NodePath<types.Identifier>, expr: types.Expression[]) => void
) {
  const callee = getExtendMacro(path, mod, 'inline')
  if (callee) {
    const expr = validateInlineMacro(callee.get('arguments'))
    const { expressions, properties, into } = printJsAST(evaluateCSS(expr, mod), expr)
    const [create, applied] = insertRelativePackage(mod.program, mod)
    const declaration = make.variableDeclaration(into, callExpression(create.node, [make.objectExpression(properties)]))
    const nearest = findNearestTopLevelAncestor(path)
    nearest.insertBefore(declaration)
    handler(path, applied, expressions)
  }
}

// inline processing two scenes.
// 1. as props/attrs function argument
// 2. call it as single.

export function transformInline(path: NodePath<types.CallExpression>, mod: Module) {
  // check path
  if (path.parent.type === 'CallExpression') {
    // check again
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, applied] = mod.importIdentifiers
    const { parent } = path
    if (parent.callee.type === 'Identifier' && parent.callee.name !== applied) {
      return
    }

    if (parent.callee.type === 'MemberExpression') {
      const prop = parent.callee.property
      if (prop.type === 'Identifier' && prop.name !== applied) {
        return
      }
    }
    insertAndReplace(path, mod, (p, _, expressions) => {
      p.replaceInline(expressions)
    })
    return
  }
  // single call

  insertAndReplace(path, mod, (p, applied, expressions) => {
    p.replaceWith(make.callExpression(applied.node, expressions))
  })
}
