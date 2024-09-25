import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { compile, serialize, stringify } from 'stylis'
import { MESSAGES } from '../ast/message'
import { Module } from '../module'
import { findNearestStatementAncestor, isObjectExpression, isTopLevelCalled } from '../ast/shared'
import { evaluateCSS, printCssAST } from '../ast/evaluate-path'
import { getExtendMacro } from './inline'

function validateInjectGlobalStyleMacro(
  path: NodePath<types.Expression | types.ArgumentPlaceholder | types.SpreadElement>[],
  path2: NodePath<types.Node>
) {
  if (!isTopLevelCalled(path2)) throw new Error(MESSAGES.ONLY_TOP_LEVEL_INJECT_GLOBAL_STYLE)
  if (path.length > 1) throw new Error(MESSAGES.GLOBAL_STYLE_ONLY_ONE_ARGUMENT)
  if (isObjectExpression(path[0])) {
    return path[0]
  }
  throw new Error(MESSAGES.INVALID_CSS_AST_KIND)
}

export function transformInjectGlobalStyle(path: NodePath<types.CallExpression>, mod: Module) {
  const callee = getExtendMacro(path, mod, 'injectGlobalStyle')
  if (callee) {
    const expr = validateInjectGlobalStyleMacro(callee.get('arguments'), findNearestStatementAncestor(path))
    const evaluated = evaluateCSS(expr, mod)
    const { css } = printCssAST(evaluated, mod)
    path.replaceWith(types.stringLiteral(''))
    return serialize(compile(css), stringify)
  }
}
