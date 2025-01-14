import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { xxhash } from '@stylex-extend/shared'
import { MESSAGES } from '../ast/message'
import { getStringLikeKindValue, isStringLiteral } from '../ast/shared'
import { Module } from '../module'
import { getExtendMacro } from './inline'

function validateIdMacro(path: NodePath<types.Expression | types.ArgumentPlaceholder | types.SpreadElement>[]) {
  if (!path.length) { return '' }
  if (isStringLiteral(path[0])) {
    return getStringLikeKindValue(path[0])
  }
  throw new Error(MESSAGES.INVALID_ID_ARGUMENT)
}

// https://github.com/facebook/stylex/discussions/684
// the generate id should be a css variable.
// const myId = id()
export function transformId(path: NodePath<types.CallExpression>, mod: Module) {
  const callee = getExtendMacro(path, mod, 'id')
  if (callee) {
    const scopeName = validateIdMacro(callee.get('arguments'))
    const id = scopeName + xxhash(mod.filename)
    path.replaceWith(types.stringLiteral(`var(--${id})`))
  }
}
