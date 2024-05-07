import { types } from '@babel/core'
import type { NodePath } from '@babel/core'

export type StringLikeKindPath = NodePath<types.StringLiteral | types.Identifier> 

export type CalleeExpression = types.Expression | types.V8IntrinsicIdentifier

export function isStringLikeKind(path: NodePath<types.Node>): path is StringLikeKindPath {
  return path.isStringLiteral() || path.isIdentifier()
}

export function isIdentifier(path: NodePath<types.Node>): path is NodePath<types.Identifier> {
  return path.isIdentifier()
}

export function getStringLikeKindValue(path: StringLikeKindPath) {
  if (path.node.type === 'StringLiteral') {
    return path.node.value
  }
  return path.node.name
}

export function callExpression(callee: CalleeExpression, args: types.Expression[]) {
  return types.callExpression(callee, args)
}

export function arrowFunctionExpression(params: types.Identifier[], body: types.Expression) {
  return types.arrowFunctionExpression(params, body)
}
export function stringLiteral(value: string) {
  return types.stringLiteral(value)
}

export function objectProperty(key: types.StringLiteral | types.Identifier, value: types.Expression) {
  return types.objectProperty(key, value)
}

export function objectExpression(properties: types.ObjectProperty[]) {
  return types.objectExpression(properties)
}

export function memberExpression(object: types.Expression, property: types.PrivateName | types.Expression, computed: boolean = false) {
  return types.memberExpression(object, property, computed)
}

export function isObjectExpression(path: NodePath<types.Node>): path is NodePath<types.ObjectExpression > {
  return path.isObjectExpression()
}

export function isObjectProperty(path: NodePath<types.Node>): path is NodePath<types.ObjectProperty> {
  return path.isObjectProperty()
}

export function isSpreadElement(path: NodePath<types.Node>): path is NodePath<types.SpreadElement> {
  return path.isSpreadElement()
}

export function isMemberExpression(path: NodePath<types.Node>): path is NodePath<types.MemberExpression> {
  return path.isMemberExpression()
}

export function is(condit: boolean, message: string = 'Invalid Error') {
  if (!condit) throw new Error(message)
}
