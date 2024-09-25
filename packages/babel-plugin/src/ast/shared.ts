import { types } from '@babel/core'
import { NodePath } from '@babel/core'

export type StringLikeKindPath = NodePath<types.StringLiteral | types.Identifier>

export type StringLikeKind = types.StringLiteral | types.Identifier

export type CalleeExpression = types.Expression | types.V8IntrinsicIdentifier

export function isStringLikeKind(path: NodePath<types.Node>): path is StringLikeKindPath {
  return path.isStringLiteral() || path.isIdentifier()
}

export function isStringLiteral(path: NodePath<types.Node>): path is NodePath<types.StringLiteral> {
  return path.isStringLiteral()
}

export function isNumericLiteral(path: NodePath<types.Node>): path is NodePath<types.NumericLiteral> {
  return path.isNumericLiteral()
}

export function isBooleanLiteral(path: NodePath<types.Node>): path is NodePath<types.BooleanLiteral> {
  return path.isBooleanLiteral()
}

export function isNullLiteral(path: NodePath<types.Node>): path is NodePath<types.NullLiteral> {
  return path.isNullLiteral()
}

export function isIdentifier(path: NodePath<types.Node>): path is NodePath<types.Identifier> {
  return path.isIdentifier()
}

export function isReferencedIdentifier(path: NodePath<types.Node>): path is NodePath<types.Identifier> {
  return path.isReferencedIdentifier()
}

export function isConditionalExpression(path: NodePath<types.Node>): path is NodePath<types.ConditionalExpression> {
  return path.isConditionalExpression()
}

export function getStringLikeKindValue(path: StringLikeKindPath | StringLikeKind) {
  if (!('node' in path)) {
    if (path.type === 'StringLiteral') return path.value
    return path.name
  }
  return getStringLikeKindValue(path.node)
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

export function variableDeclaration(identifier: types.Identifier | string, ast: types.Expression) {
  return types.variableDeclaration('const', [
    types.variableDeclarator(typeof identifier === 'string' ? types.identifier(identifier) : identifier, ast)
  ])
}

export function isObjectExpression(path: NodePath<types.Node>): path is NodePath<types.ObjectExpression> {
  return path.isObjectExpression()
}

export function isObjectProperty(path: NodePath<types.Node>): path is NodePath<types.ObjectProperty> {
  return path.isObjectProperty()
}

export function isSpreadElement(path: NodePath<types.Node>): path is NodePath<types.SpreadElement> {
  return path.isSpreadElement()
}

export function isObjectMethod(path: NodePath<types.Node>): path is NodePath<types.ObjectMethod> {
  return path.isObjectMethod()
}

export function isMemberExpression(path: NodePath<types.Node>): path is NodePath<types.MemberExpression> {
  return path.isMemberExpression()
}

export function isTemplateLiteral(path: NodePath<types.Node>): path is NodePath<types.TemplateLiteral> {
  return path.isTemplateLiteral()
}

export function isCallExpression(path: NodePath<types.Node>): path is NodePath<types.CallExpression> {
  return path.isCallExpression()
}

export function isTopLevelCalled(path: NodePath<types.Node>) {
  return types.isProgram(path.parent) || types.isExportDefaultDeclaration(path.parent) || types.isExportNamedDeclaration(path.parent)
}

export function isStmt(path: NodePath<types.Node>): path is NodePath<types.Statement> {
  return path.isStatement()
}

export function is(condit: boolean, message: string = 'Invalid Error') {
  if (!condit) throw new Error(message)
}

export function isLogicalExpression(path: NodePath<types.Node>): path is NodePath<types.LogicalExpression> {
  return path.isLogicalExpression()
}

export function isImportDeclaration(path: NodePath<types.Node>): path is NodePath<types.ImportDeclaration> {
  return path.isImportDeclaration()
}

export function isImportSpecifier(path: NodePath<types.Node>): path is NodePath<types.ImportSpecifier> {
  return path.isImportSpecifier()
}

export function isImportNamespaceSpecifier(path: NodePath<types.Node>): path is NodePath<types.ImportNamespaceSpecifier> {
  return path.isImportNamespaceSpecifier()
}

export function isImportDefaultSpecifier(path: NodePath<types.Node>): path is NodePath<types.ImportDefaultSpecifier> {
  return path.isImportDefaultSpecifier()
}

export function findNearestParentWithCondition<T extends types.Node>(
  path: NodePath<types.Node>,
  condition: (p: NodePath<types.Node>) => p is NodePath<T>
): NodePath<T> {
  if (condition(path)) return path
  if (path.parentPath == null) {
    throw new Error('Unexpected Path found that is not part of the AST.')
  }
  return findNearestParentWithCondition(path.parentPath, condition)
}

export function findNearestStatementAncestor(path: NodePath<types.Node>) {
  return findNearestParentWithCondition(path, isStmt)
}

export const make = {
  objectProperty: (key: string, value: types.Expression) => objectProperty(stringLiteral(key), value),
  identifier: (name: string) => types.identifier(name),
  stringLiteral: (value: string) => stringLiteral(value),
  nullLiteral: () => types.nullLiteral(),
  numericLiteral: (value: number) => types.numericLiteral(value),
  callExpression: (callee: CalleeExpression, args: types.Expression[]) => callExpression(callee, args),
  memberExpression,
  logicalExpression: types.logicalExpression,
  arrowFunctionExpression,
  variableDeclaration,
  objectExpression,
  importDeclaration: types.importDeclaration,
  importSpecifier: types.importSpecifier
}
