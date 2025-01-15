import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { xxhash } from '@stylex-extend/shared'
import { MESSAGES } from '../ast/message'
import { findNearestStatementAncestor, isBooleanLiteral, isTopLevelCalled, make } from '../ast/shared'
import { Module, getCanonicalFilePath } from '../module'
import { getExtendMacro } from './inline'

function validateIdMacro(
  path: NodePath<types.Expression | types.ArgumentPlaceholder | types.SpreadElement>[],
  path2: NodePath<types.Node>
) {
  if (!path.length) { return '' }
  if (!isTopLevelCalled(path2)) { throw new Error(MESSAGES.ONLY_TOP_LEVEL_ID) }
  if (isBooleanLiteral(path[0])) {
    return path[0].node.value
  }
  throw new Error(MESSAGES.INVALID_ID_ARGUMENT)
}

function generateIdExpression(id: string) {
  const value = types.stringLiteral(`var(--${id})`)
  const specialID = types.stringLiteral('stylex-extend')
  return types.objectExpression([
    types.objectProperty(make.identifier('$id'), specialID),
    types.objectProperty(make.identifier('value'), value)
  ])
}

// https://github.com/facebook/stylex/discussions/684
// the generate id should be a css variable.
// const myId = id() => { $id: 'stylex-extend', value: xxhash }
export function transformId(path: NodePath<types.CallExpression>, mod: Module) {
  const callee = getExtendMacro(path, mod, 'id')
  if (callee) {
    const isVariant = validateIdMacro(callee.get('arguments'), findNearestStatementAncestor(callee))
    const id = xxhash(getCanonicalFilePath(mod.filename, mod.cwd))
    if (isVariant) {
      path.replaceWith(generateIdExpression(id))
      return
    }
    path.replaceWith(types.stringLiteral(`var(--${id})`))
  }
}
