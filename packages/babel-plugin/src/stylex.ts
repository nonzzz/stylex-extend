import { NodePath, PluginPass, types } from '@babel/core'
import type { CssObjectValue } from './interface'

const HELPER_NAME = '__stylex__helper'
const MODULE_NAME = '@stylexjs/stylex'

interface VariableMeta {
  ast: types.Identifier | types.MemberExpression | types.ObjectExpression
  reference?: types.Identifier | types.MemberExpression
}

interface Effect {
  state: boolean
  nested: boolean
  ast: types.ArrowFunctionExpression | undefined
  variables: Map<string, VariableMeta>
  parameters: Set<string>
  cleanp(): void
}

const defualtEffect = { state: false, ast: undefined, nested: false }

const effect = <Effect>{
  state: false,
  nested: false,
  ast: undefined,
  parameters: new Set(),
  variables: new Map(),
  cleanp() {
    Object.assign(effect, defualtEffect)
    this.variables.clear()
    this.parameters.clear()
  }
}

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

function processAttributeName(s: string) {
  return '_' + s
}

function evaluateCSSValue(parentKey: string, node: types.ObjectProperty['value'], t: typeof types) {
  switch (node.type) {
    case 'NullLiteral':
      return null
    case 'Identifier': {
      effect.state = true
      if (node.name === 'undefined') return null
      return processAttributeName(node.name)
    }
    case 'MemberExpression': {
      effect.state = true
      if (node.property.type === 'Identifier') {
        return processAttributeName(node.property.name)
      }
      throw new Error('cannot use computed property for stylex object attribute')
    }
    case 'StringLiteral':
      return processStyleName(getStringValue(node))
    case 'NumericLiteral':
      return node.value
    case 'ObjectExpression': {
      effect.nested = true
      const cssObject = evaluateObjectExpression(node, t, parentKey)
      if (effect.state) {
        effect.variables.set(parentKey, { ast: convertObjectToAST(cssObject, t, true) })
        return
      }
      effect.nested = false
      return cssObject
    }
  }
}

function evaluateObjectExpression(expression: types.ObjectExpression, t: typeof types, _ = '') {
  const cssObject: CssObjectValue = Object.create(null)
  for (const property of expression.properties) {
    effect.state = false
    switch (property.type) {
      case 'ObjectProperty': {
        if (property.computed) throw new Error('cannot use computed property for stylex object attribute')
        if (isStringLike(property.key)) {
          const key = getStringValue(property.key)
          const value = evaluateCSSValue(key, property.value, t)
          const nil = value === null || value === undefined
          if (effect.state && !effect.nested) {
            const paramter = processAttributeName(key)
            effect.parameters.add(paramter)
            effect.variables.set(key, { ast: t.identifier(paramter), reference: property.value as VariableMeta['reference'] })
          } else {
            if (key === 'default' && nil) {
              cssObject[key] = null
            } else if (!nil) {
              cssObject[key] = value
            }
          }
        }
        continue
      }
      case 'SpreadElement': {
        // TODO: handle spread element
        // Spread element may contain dynamic value
        // If the value is static we should generate new css object
        continue
      }
    }
  }
  return cssObject
}

function convertObjectToAST(object: any, t: typeof types, usingIdentifer = false): types.ObjectExpression {
  return t.objectExpression(Object.entries(object).map(([key, value]) => {
    return t.objectProperty(t.stringLiteral(key),
      typeof value === 'undefined'
        ? t.identifier('undefined')
        : typeof value === 'string'
          ? usingIdentifer ? t.identifier(value) : t.stringLiteral(value)
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

export function transformStylexObjectExpression(path: NodePath<types.JSXAttribute>, expression: types.ObjectExpression, state: PluginPass, t: typeof types) {
  effect.cleanp()
  const variable = path.scope.generateUidIdentifier('styles')
  const cssObject = evaluateObjectExpression(expression, t)
  const expr: Array<types.Expression> = [t.memberExpression(t.identifier(variable.name), t.identifier('css'))]
  const ast = convertObjectToAST({ css: cssObject }, t)
  if (effect.parameters.size) {
    const parmas = [...effect.parameters].map(key => t.identifier(key))
    const body = []
    for (const [key, { ast }] of effect.variables.entries()) {
      body.push(t.objectProperty(t.stringLiteral(key), ast))
    }
    effect.ast = t.arrowFunctionExpression(parmas, t.objectExpression(body))
    ast.properties.push(t.objectProperty(t.identifier('dynamic'), effect.ast))
    const references = []
    for (const { reference } of effect.variables.values()) {
      reference && references.push(reference)
    }
    expr.push(t.callExpression(t.memberExpression(variable, t.identifier('dynamic')), references))
  }
  
  state.statements.push(variableDeclaration(t, variable, wrapperExpressionWithStylex([ast], 'create', t)))
  path.replaceWith(t.jsxSpreadAttribute(wrapperExpressionWithStylex(expr, state.pluginOptions.stylex.helper, t)))
  effect.cleanp()
}
