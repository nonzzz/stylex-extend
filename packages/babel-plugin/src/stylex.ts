import { NodePath, PluginPass, types } from '@babel/core'
import type { CssObjectValue } from './interface'

const HELPER_NAME = '__stylex__extend__helper__'
const MODULE_NAME = '@stylexjs/stylex'

export function injectStylexHelper(t: typeof types) {
  return t.importDeclaration([t.importNamespaceSpecifier(t.identifier(HELPER_NAME))], t.stringLiteral(MODULE_NAME))
}

export function variableDeclaration(t: typeof types, identifier: types.Identifier | string, ast: types.Expression) {
  return t.variableDeclaration('const', [
    t.variableDeclarator(typeof identifier === 'string' ? t.identifier(identifier) : identifier, ast)])
}

function isStringLike(node: types.Node): node is types.Identifier | types.StringLiteral {
  return node.type === 'Identifier' || node.type === 'StringLiteral'
}

function getStringValue(kind: types.StringLiteral | types.Identifier) {
  if (kind.type === 'Identifier') return kind.name
  return kind.value
}

const hyphenateRegex = /[A-Z]|^ms/g

function isCustomProperty(prop: string) {
  return prop.charCodeAt(1) === 45
}

function processStyleName(prop: string) {
  return isCustomProperty(prop) ? prop : prop.replace(hyphenateRegex, '-$&').toLowerCase()
}

function evaluateCSSValue(node: types.ObjectProperty['value'], t: typeof types, selector = true): CssObjectValue | string | number | undefined {
  switch (node.type) {
    case 'StringLiteral':
      return processStyleName(getStringValue(node))
    case 'NumericLiteral':
      return node.value
    case 'ObjectExpression':
      return evaluateObjectExpression(node, t, selector)
  }
}

function evaluateObjectExpression(expression: types.ObjectExpression, t: typeof types, selector = true) {
  const cssObject: CssObjectValue = Object.create(null)
  for (const property of expression.properties) {
    switch (property.type) {
      case 'ObjectProperty': {
        if (property.computed) throw new Error('cannot use computed property for stylex object attribute')
        if (isStringLike(property.key)) {
          const key = getStringValue(property.key)
          const value = evaluateCSSValue(property.value, t, selector)
          if (value !== null && value !== undefined) cssObject[key] = value
        }
      }
    }
  }
  return cssObject
}

function convertObjectToAST(object: CssObjectValue, t: typeof types): types.ObjectExpression {
  return t.objectExpression(Object.entries(object).map(([key, value]) => {
    return t.objectProperty(t.stringLiteral(key),
      typeof value === 'undefined'
        ? t.identifier('undefined')
        : typeof value === 'string'
          ? t.stringLiteral(value)
          : typeof value === 'number'
            ? t.numericLiteral(value)
            : typeof value === 'boolean'
              ? t.booleanLiteral(value) 
              : value === null ? t.nullLiteral() : convertObjectToAST(value!, t)
    )
  }))
}

function wrapperExpressionWithStylex(ast: Array<types.Expression>, callee: string, t: typeof types) {
  return t.callExpression(t.memberExpression(t.identifier(HELPER_NAME), 
    t.identifier(callee)), ast)
}

export function transformStylexObjectExpression(path: NodePath<types.JSXAttribute>,
  expression: types.ObjectExpression, state: PluginPass, t: typeof types) {
  const variable = path.scope.generateUidIdentifier('stylex_extend')
  const cssObject = evaluateObjectExpression(expression, t, false)
  const ast = convertObjectToAST({ css: cssObject }, t)
  state.statements.push(variableDeclaration(t, variable, wrapperExpressionWithStylex([ast], 'create', t)))
  const expr = t.memberExpression(t.identifier(variable.name), t.identifier('css'))
  path.replaceWith(t.jsxSpreadAttribute(wrapperExpressionWithStylex([expr], state.pluginOptions.stylex.helper, t)))
}
