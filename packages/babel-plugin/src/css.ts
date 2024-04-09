import { NodePath, types } from '@babel/core'
import { Context } from './state-context'
import type { CSSObjectValue } from './interface'

interface Loc {
  pos: number
  kind: 'spare' | 'prop'

}

interface ParamterMeta {
  node: types.Expression
  loc: Array<Loc>
}

interface CSSContextStates {
  nested: boolean
  spread: boolean
}

class CSSContext {
  pos: number
  maxLayer: number
  paramters: Map<string, ParamterMeta>
  variables: Map<number, types.Identifier[]>
  state: CSSContextStates
  rules: Array<CSSObjectValue>
  dynamicPositions: Set<number>
  constructor(maxLayer = 0) {
    this.pos = 0
    this.paramters = new Map()
    this.variables = new Map()
    this.state = { nested: false, spread: false }
    this.maxLayer = maxLayer
    this.rules = []
    this.dynamicPositions = new Set()
  }

  advance() {
    if (this.pos < this.maxLayer) {
      this.pos++
    }
  }

  updateParamters(key: string, loc: Loc, node: types.Expression) {
    if (this.paramters.has(key)) {
      const param = this.paramters.get(key)!
      param.loc.push(loc)
      param.node = node
    } else {
      this.paramters.set(key, { node, loc: [loc] })
    }
  }

  updateVariables(pos: number, node: types.Identifier) {
    if (this.variables.has(pos)) {
      this.variables.get(pos)!.push(node)
      return
    }
    this.variables.set(pos, [node])
  }
}

function createCSSContext(maxLayer = 0) {
  return new CSSContext(maxLayer)
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

function scanExpressionProperty(path: NodePath<types.ObjectProperty>, ctx: CSSContext) {
  if (path.node.computed) throw new Error('[stylex-extend]: can\'t use computed property for stylex object attributes')
  const { key, value } = path.node
  if (!isStringLikeKind(key)) throw new Error('[stylex-extend]: object key must be string')
  const CSSObject: CSSObjectValue = Object.create(null)
  const attr = getStringValue(key)
  switch (value.type) {
    case 'NullLiteral':
      CSSObject[attr] = null
      break
    case 'Identifier': {
      if (value.name === 'undefined') {
        CSSObject[attr] = undefined
      } else {
        CSSObject[attr] = p(value.name)
        ctx.updateParamters(value.name, { pos: ctx.pos, kind: 'prop' }, value)
        ctx.dynamicPositions.add(ctx.pos)
        ctx.updateVariables(ctx.pos, value)
      }
      break
    }
    case 'StringLiteral':
    case 'NumericLiteral':
      CSSObject[attr] = value.value
      break 
    case 'TemplateLiteral': {
      break 
    }
    case 'ConditionalExpression': {
      break
    }
    case 'MemberExpression': {
      if (value.object.type === 'Identifier' && value.property.type === 'Identifier') {
        const ref = value.object.name + '.' + value.property.name
        CSSObject[attr] = p(value.property.name)
        ctx.updateParamters(ref, { pos: ctx.pos, kind: 'prop' }, value)
        ctx.dynamicPositions.add(ctx.pos)
        ctx.updateVariables(ctx.pos, types.identifier(value.property.name))
      }
      break
    }
    case 'ObjectExpression': {
      const valuePath = path.get('value')
      const CSSObject = Object.create(null)
      if (valuePath.isObjectExpression()) {
        ctx.state.nested = true
        for (const prop of valuePath.get('properties')) {
          Object.assign(CSSObject, scanExpressionProperty(prop as NodePath<types.ObjectProperty>, ctx))
        }
        ctx.state.nested = false
      }
      return { [attr]: CSSObject }
    }
  }
  return CSSObject
}

function scanObjectExpression(path: NodePath<types.ObjectExpression>, ctx: CSSContext) {
  const properties = path.get('properties')
  while (ctx.pos < ctx.maxLayer) {
    const prop = properties[ctx.pos]
    const { node } = prop
    switch (node.type) {
      case 'ObjectProperty': {
        ctx.rules.push(scanExpressionProperty(prop as NodePath<types.ObjectProperty>, ctx))
        break
      }
      case 'SpreadElement': {
        const arg = node.argument
        if (arg.type === 'ObjectExpression') {
          const path = prop.get('argument') as NodePath<types.ObjectExpression>
          const CSSObject = {}
          for (const p of path.get('properties')) {
            Object.assign(CSSObject, scanExpressionProperty(p as NodePath<types.ObjectProperty>, ctx))
          }
          const attr = '#' + ctx.pos
          ctx.rules.push({ [attr]: CSSObject })
        } else if (arg.type === 'LogicalExpression') {
          const path = prop.get('argument') as NodePath<types.LogicalExpression>
          if (path.node.operator === '&&') {
            const left = path.get('left')
            const right = path.get('right')
            if (!right.isObjectExpression()) throw new Error('[stylex-extend]: right side of logical expression must be object expression')
            const CSSObject = {} 
            for (const p of right.get('properties')) {
              Object.assign(CSSObject, scanExpressionProperty(p as NodePath<types.ObjectProperty>, ctx))
            }
            const attr = '#' + ctx.pos
            ctx.rules.push({ [attr]: CSSObject })
            ctx.updateParamters(attr, { pos: ctx.pos, kind: 'spare' }, left.node)
          }
        }

        break
      }
    }
    ctx.advance()
  }
}

function ensureCSSValueASTKind(value: string | number | null | undefined) {
  let ast: types.Expression
  switch (typeof value) {
    case 'undefined':
      ast = types.identifier('undefined')
      break
    case 'string':
      if (value === 'undefined') {
        ast = types.identifier('undefined')
      } else {
        if (value[0] === '_' && value[1] === '#') {
          ast = types.identifier(value.slice(2))
        } else {
          ast = types.stringLiteral(value)
        }
      }
      break
    case 'object':
      ast = types.nullLiteral()
      break
    case 'number':
      ast = types.numericLiteral(value)
  }
  return ast
}

function convertToAST(CSSRules: CSSObjectValue[], nested = false) {
  const ast: types.ObjectProperty[] = []
  for (const rule of CSSRules) {
    const c: types.ObjectProperty[] = []
    for (const prop in rule) {
      const v = rule[prop]
      if (typeof v === 'object' && v !== null) {
        const childAST = convertToAST([v], true)
        c.push(types.objectProperty(types.stringLiteral(prop), childAST))
      } else {
        const value = ensureCSSValueASTKind(v)
        c.push(types.objectProperty(types.stringLiteral(prop), value))
      }
      if (nested || prop[0] === '#') {
        ast.push(...c)
        c.length = 0
      } else {
        ast.push(types.objectProperty(types.stringLiteral(prop), types.objectExpression(c)))
      }
    }
  }
  return types.objectExpression(ast)
}

function evaluateCSSAST(CSSAST: types.ObjectExpression, ctx: CSSContext) {
  const ast: types.ObjectProperty[] = []
  for (let i = 0; i < CSSAST.properties.length; i++) {
    const item = CSSAST.properties[i]
    if (item.type === 'ObjectProperty' && ctx.dynamicPositions.has(i)) {
      const variables = ctx.variables.get(i)!
      if (isStringLikeKind(item.key)) {
        const key = getStringValue(item.key)
        const fn = arrowFunctionExpression(variables, item.value as types.Expression)
        ast.push(types.objectProperty(types.stringLiteral(key), fn))
      }
      continue
    }
    // @ts-expect-error
    ast.push(item)
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
  const CSSContext = createCSSContext(expression.node.properties.length)
  scanObjectExpression(expression, CSSContext)
  const CSSAST = evaluateCSSAST(convertToAST(CSSContext.rules), CSSContext)
  const expr: Array<types.MemberExpression | types.CallExpression | types.SpreadElement> = []
  for (const prop of CSSAST.properties) {
    if (prop.type === 'ObjectProperty') {
      expr.push(types.memberExpression(variable, prop.key, true))
    }
  }
   
  // eslint-disable-next-line no-unused-vars
  for (const [_, { node, loc }] of CSSContext.paramters) {
    for (const { pos, kind } of loc) {
      const previous = expr[pos]
      if (!previous) continue
      if (kind === 'prop' && previous.type === 'MemberExpression') {
        expr[pos] = callExpression(previous, [node])
      }
      if (kind === 'prop' && previous.type === 'CallExpression') {
        previous.arguments.push(node)
        expr[pos] = previous
      }
      if (kind === 'spare' && previous.type !== 'SpreadElement') {
        expr[pos] = spreadElement(types.logicalExpression('&&', node, previous))
      }
    }
  }
  const stylexDeclaration = variableDeclaration(variable, types.callExpression(importIdentifiers.create, [CSSAST]))
  ctx.stmts.push(stylexDeclaration)
  path.replaceWith(types.jsxSpreadAttribute(types.callExpression(attach, expr)))
}
