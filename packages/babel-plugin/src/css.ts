import { NodePath, types } from '@babel/core'
import { Context } from './state-context'
import type { CSSObjectValue } from './interface'

interface CSSContext {
  cssRules: Map<string, { node: types.Expression, loc: Array<{ pos: number, kind: 'spare' | 'prop' }> }>
  count: number
  variables: Map<string, types.Identifier>
  isNested: boolean
  isSpread: boolean
}

function isStringLikeKind(node: types.Node): node is types.Identifier | types.StringLiteral {
  return types.isIdentifier(node) || types.isStringLiteral(node)
}

function getStringValue(kind: types.StringLiteral | types.Identifier) {
  if (kind.type === 'Identifier') return kind.name
  return kind.value
}

function variableDeclaration(identifier: types.Identifier | string, ast: types.Expression) {
  return types.variableDeclaration('const', [
    types.variableDeclarator(typeof identifier === 'string' ? types.identifier(identifier) : identifier, ast)])
}

function arrowFunctionExpression(params: types.Identifier[], body: types.Expression) {
  return types.arrowFunctionExpression(params, body)
}

function callExpression(callee: types.Expression, args: types.Expression[]) {
  return types.callExpression(callee, args)
}

function spreadElement(expression: types.Expression) {
  return types.spreadElement(expression)
}

function p(s: string) {
  return '_#' + s
}

function scanExpressionProperty(path: NodePath<types.ObjectProperty>, cssContext: CSSContext) {
  if (path.node.computed) throw new Error('[stylex-extend]: can\'t use computed property for stylex object attributes')
  const { key, value } = path.node
  if (!isStringLikeKind(key)) throw new Error('[stylex-extend]: object key must be string')

  const attr = getStringValue(key)
  let result = null
  switch (value.type) {
    case 'NullLiteral': {
      result = null
      break
    }
    case 'Identifier': {
      if (value.name === 'undefined') {
        result = undefined
      } else {
        result = p(value.name)
        if (cssContext.cssRules.has(value.name)) {
          cssContext.cssRules.get(value.name)!.loc.push({ pos: cssContext.count, kind: 'prop' })
        } else {
          cssContext.cssRules.set(value.name, { node: value, loc: [{ pos: cssContext.count, kind: 'prop' }] })
        }
        if (cssContext.isNested) {
          cssContext.count++
        }
        if (cssContext.isSpread && cssContext.isNested) {
          cssContext.count--
        }
      }
      break
    }
    case 'StringLiteral': {
      result = value.value
      break
    }
    case 'NumericLiteral': {
      result = value.value
      break
    }
    case 'MemberExpression': {
      if (value.object.type === 'Identifier' && value.property.type === 'Identifier') {
        const attr = value.object.name + '.' + value.property.name
        result = p(attr)
        if (cssContext.cssRules.has(attr)) {
          cssContext.cssRules.get(attr)!.loc.push({ pos: cssContext.count, kind: 'prop' })
        } else {
          cssContext.cssRules.set(attr, { node: value, loc: [{ pos: cssContext.count, kind: 'prop' }] })
        }
        break 
      }
      throw new Error('cannot use computed property for stylex object attribute')
    }
    case 'ObjectExpression': {
      cssContext.isNested = true
      result = scanObjectExpression(path.get('value') as NodePath<types.ObjectExpression>, cssContext)
      cssContext.isNested = false
      break
    }
  }
  if (!cssContext.isNested) {
    cssContext.count++
  }

  return { attr, result }
}

function scanObjectExpression(path: NodePath<types.ObjectExpression>, cssContext: CSSContext) {
  const CSSObject: CSSObjectValue = {}
  for (const prop of path.get('properties')) {
    if (prop.isObjectProperty()) {
      const { attr, result } = scanExpressionProperty(prop, cssContext)
      CSSObject[attr] = result
    }
    if (prop.isSpreadElement()) {
      const arg = prop.get('argument')
      if (arg.isObjectExpression()) {
        const spreadObject = scanObjectExpression(arg, cssContext)
        CSSObject['#' + cssContext.count] = spreadObject
      }
      if (arg.isLogicalExpression()) {
        if (arg.node.operator === '&&') {
          const left = arg.get('left')
          const right = arg.get('right')
          if (!right.isObjectExpression()) throw new Error('right side of logical expression must be object expression')
          cssContext.isNested = true
          cssContext.isSpread = true
          const rightObject = scanObjectExpression(right, cssContext)
          cssContext.isNested = false
          cssContext.isSpread = true
          if (left.node.type === 'NumericLiteral' && left.node.value) {
            CSSObject['#' + cssContext.count] = rightObject
          } else if (isStringLikeKind(left.node)) {
            const attr = getStringValue(left.node)
            if (attr) {
              CSSObject['#' + attr] = rightObject
            }
            if (left.node.type === 'Identifier') {
              if (cssContext.cssRules.has(left.node.name)) {
                cssContext.cssRules.get(left.node.name)!.loc.push({ pos: cssContext.count, kind: 'spare' })
              } else {
                cssContext.cssRules.set(left.node.name, { node: left.node, loc: [{ pos: cssContext.count, kind: 'spare' }] })
              }
            }
          } else if (left.node.type === 'MemberExpression') {
            if (left.node.object.type === 'Identifier' && left.node.property.type === 'Identifier') {
              const attr = left.node.object.name + '.' + left.node.property.name
              CSSObject['#' + cssContext.count] = rightObject
              if (cssContext.cssRules.has(attr)) {
                cssContext.cssRules.get(attr)!.loc.push({ pos: cssContext.count, kind: 'spare' })
              } else {
                cssContext.cssRules.set(attr, { node: left.node, loc: [{ pos: cssContext.count, kind: 'spare' }] })
              }
            }
          }
          cssContext.count++
        }
      }
    }
  }
  return CSSObject
}

function convertObjectToAST(cssObject: CSSObjectValue, cssContext: CSSContext, nested = false, spread = false) {
  const ast: Array<types.ObjectProperty> = []
  for (const [key, value] of Object.entries(cssObject)) {
    if (key[0] === '#' && typeof value === 'object' && value !== null) {
      const c = convertObjectToAST(value, cssContext, true, true)
      if (cssContext.variables.size && !spread) {
        const vars = Array.from(cssContext.variables.values())
        const fn = arrowFunctionExpression(vars, c)
        ast.push(types.objectProperty(types.stringLiteral(key), fn))
        cssContext.variables.clear()
      } else {
        ast.push(types.objectProperty(types.stringLiteral(key), c))
      }
    } else {
      if (typeof value === 'undefined') {
        ast.push(types.objectProperty(types.stringLiteral(key), types.identifier('undefined')))
      }
      if (typeof value === 'string') {
        if (value[0] === '_' && value[1] === '#') {
          const attr = value.slice(2)
          const [obj, prop] = attr.split('.')
          const identifier = obj && prop ? types.identifier(prop) : types.identifier(obj)
          if (nested) { 
            cssContext.variables.set(key, identifier)
            ast.push(types.objectProperty(types.stringLiteral(key), identifier))
          } else {
            const fn = arrowFunctionExpression([identifier], types.objectExpression([types.objectProperty(types.stringLiteral(key), identifier)]))
            ast.push(types.objectProperty(types.stringLiteral(key), fn))
          }
        } else {
          ast.push(types.objectProperty(types.stringLiteral(key), types.stringLiteral(value)))
        }
      }
      if (typeof value === 'number') {
        ast.push(types.objectProperty(types.stringLiteral(key), types.numericLiteral(value)))
      }
      if (typeof value === 'boolean') {
        ast.push(types.objectProperty(types.stringLiteral(key), types.booleanLiteral(value)))
      }
      if (typeof value === 'object') {
        if (value === null) {
          ast.push(types.objectProperty(types.stringLiteral(key), types.nullLiteral()))
        } else {
          const c = convertObjectToAST(value, cssContext, true)
          if (cssContext.variables.size && !spread) {
            const vars = Array.from(cssContext.variables.values())
            const fn = arrowFunctionExpression(vars, c)
            ast.push(types.objectProperty(types.stringLiteral(key), fn))
            cssContext.variables.clear()
          } else {
            ast.push(types.objectProperty(types.stringLiteral(key), c))
          }
        }
      }
      if (ast[ast.length - 1].value.type !== 'ArrowFunctionExpression' && !nested) {
        const current = ast.pop()!
        ast.push(types.objectProperty(types.stringLiteral(key), types.objectExpression([current])))
      }
    }
  }
  return types.objectExpression(ast)
}

export function transformStylexAttrs(path: NodePath<types.JSXAttribute>, ctx: Context) {
  const value = path.get('value')
  if (!value.isJSXExpressionContainer()) return
  const { importIdentifiers, attach } = ctx
  const variable = path.scope.generateUidIdentifier('styles')
  const expression = value.get('expression')
  if (!expression.isObjectExpression()) throw new Error('[stylex-extend]: can\'t pass not object value for attribute \'stylex\'.')
  const cssRules: CSSContext['cssRules'] = new Map()
  const cssContext: CSSContext = { cssRules, count: 0, variables: new Map(), isNested: false, isSpread: false }
  const cssObject = scanObjectExpression(expression, cssContext)
  const cssAST = convertObjectToAST(cssObject, cssContext)
  const expr: Array<types.MemberExpression | types.CallExpression | types.SpreadElement> = Object.keys(cssObject).map(key => {
    if (key[0] === '#') {
      return types.memberExpression(types.identifier(variable.name), types.stringLiteral(key), true)
    }
    return types.memberExpression(types.identifier(variable.name), types.identifier(key))
  })
  // eslint-disable-next-line no-unused-vars
  for (const [_, { node, loc }] of cssContext.cssRules) {
    for (const { pos, kind } of loc) {
      const previous = expr[pos]
      if (!previous) continue
      if (kind === 'prop' && previous.type === 'MemberExpression') {
        expr[pos] = callExpression(previous, [node])
      }
      if (kind === 'spare' && previous.type !== 'SpreadElement') {
        expr[pos] = spreadElement(types.logicalExpression('&&', node, previous))
      }
    }
  }

  const stylexDeclaration = variableDeclaration(variable, types.callExpression(importIdentifiers.create, [cssAST]))
  ctx.stmts.push(stylexDeclaration)
  path.replaceWith(types.jsxSpreadAttribute(types.callExpression(attach, expr)))
}
