/* eslint-disable no-labels */
import { NodePath, types } from '@babel/core'
import { utils } from '@stylexjs/shared'
import { Context } from '../state-context'
import type { CSSObjectValue } from '../interface'

type Kind = 'spared' | 'prop'
interface VarsMeta {
  refers: types.Identifier[]
  referSets: Set<string>
  originals: Partial<Record<Kind, NodePath<types.Expression>[]>>
}

interface CSSContextState {
  inSpread: boolean
  lastBindingPos: number
  anchor: number
}

export class CSSContext {
  pos: number
  maxLayer: number
  vars: Map<number, VarsMeta>
  rules: Array<CSSObjectValue>
  state: CSSContextState
  constructor(maxLayer = 0, anchor: number) {
    this.pos = 0
    this.vars = new Map()
    this.maxLayer = maxLayer
    this.state = { inSpread: false, lastBindingPos: 0, anchor }
    this.rules = []
  }

  advance() {
    if (this.pos < this.maxLayer) {
      this.pos++
    }
  }

  recordVars(kind: Kind, referAST: types.Identifier | null, originalAST: NodePath<types.Expression>) {
    if (this.vars.has(this.pos)) {
      const current = this.vars.get(this.pos)!
      if (referAST && !current.referSets.has(referAST.name)) {
        current.refers.push(referAST)
        current.referSets.add(referAST.name)
        if (current.originals[kind]) {
          current.originals[kind]!.push(originalAST)
        } else {
          current.originals[kind] = [originalAST]
        }
      }
      if (!referAST) {
        if (current.originals[kind]) {
          current.originals[kind]!.push(originalAST)
        } else {
          current.originals[kind] = [originalAST]
        }
      }
    } else {
      const originals = { [kind]: [originalAST] }
      this.vars.set(this.pos, { 
        refers: referAST ? [referAST] : [],
        originals,
        referSets: referAST ? new Set([referAST.name]) : new Set()
      })
    }
  }
}

export function createCSSContext(maxLayer = 0, anchor: number) {
  return new CSSContext(maxLayer, anchor)
}

function isGlobalReference(path: NodePath<types.Identifier>) {
  const hasBind = path.scope.getProgramParent().hasBinding(path.node.name)
  return hasBind
}

function isStringLikeKind(node: types.Node): node is types.Identifier | types.StringLiteral {
  return types.isIdentifier(node) || types.isStringLiteral(node)
}

export function getStringValue(kind: types.StringLiteral | types.Identifier) {
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

function l(s: string) {
  return '_$' + s
}

function m(s: string) {
  return '_~' + s
}

function r(s: string) {
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
        CSSObject[attr] = l(value.name)
        const identifier = path.get('value') as NodePath<types.Identifier>
        if (!isGlobalReference(identifier) || ctx.state.inSpread) {
          ctx.recordVars('prop', types.identifier(l(value.name)), identifier)
        } else if (isGlobalReference(identifier)) {
          const programPath = identifier.findParent(p => p.isProgram()) as NodePath<types.Program>
          if (programPath) {
            const parent = identifier.scope.getProgramParent().getBinding(value.name)
            const stmt = parent?.path.findParent(p => p.isStatement())
            if (stmt) {
              const node = types.cloneNode(stmt.node)
              stmt.remove()
              const body = programPath.get('body')
              body[ctx.state.anchor].insertAfter(node)
              ctx.state.lastBindingPos++
            }
          }
          CSSObject[attr] = r(value.name)
        }
      }
      break
    }
    case 'StringLiteral':
    case 'NumericLiteral':
      CSSObject[attr] = value.value
      break 
    case 'TemplateLiteral':
    case 'ConditionalExpression': {
      if (value.type === 'TemplateLiteral' && !value.expressions.length) {
        CSSObject[attr] = value.quasis[0].value.raw
      } else {
        const value = l(utils.hash(attr))
        CSSObject[attr] = value
        ctx.recordVars('prop', types.identifier(value), path.get('value') as NodePath<types.Expression>)
      }
      break
    }
    case 'MemberExpression': {
      if (value.object.type === 'Identifier' && value.property.type === 'Identifier') {
        CSSObject[attr] = m(value.object.name + '.' + value.property.name)
        ctx.recordVars('prop', types.identifier(l(value.property.name)), path.get('value') as NodePath<types.Expression>)
      }
      break
    }
    case 'CallExpression': {
      const value = l(utils.hash(attr))
      CSSObject[attr] = value
      ctx.recordVars('prop', types.identifier(value), path.get('value') as NodePath<types.Expression>)
      break
    }
    case 'ObjectExpression': {
      const valuePath = path.get('value')
      const CSSObject = Object.create(null)
      if (valuePath.isObjectExpression()) {
        for (const prop of valuePath.get('properties')) {
          Object.assign(CSSObject, scanExpressionProperty(prop as NodePath<types.ObjectProperty>, ctx))
        }
      }
      return { [attr]: CSSObject }
    }
  }
  return CSSObject
}

export function scanObjectExpression(path: NodePath<types.ObjectExpression>, ctx: CSSContext) {
  const properties = path.get('properties')
  loop: for (;;) {
    if (ctx.pos >= ctx.maxLayer) break loop
    const prop = properties[ctx.pos]
    const { node } = prop
    switch (node.type) {
      case 'ObjectProperty': {
        ctx.rules.push(scanExpressionProperty(prop as NodePath<types.ObjectProperty>, ctx))
        break
      }
      case 'SpreadElement': {
        const arg = node.argument
        ctx.state.inSpread = true
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
            ctx.recordVars('spared', null, left)
          }
        }
        ctx.state.inSpread = false
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
        if (value[0] === '_') {
          if (value[1] === '~') {
            const letter = value.slice(2).split('.')[1]
            ast = types.identifier(l(letter))
          } else if (value[1] === '$') {
            ast = types.identifier(value)
          } else if (value[1] === '#') {
            ast = types.identifier(value.slice(2))
          } else {
            ast = types.stringLiteral(value)
          }
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
    if (item.type === 'ObjectProperty' && ctx.vars.has(i)) {
      const { refers: variables, originals } = ctx.vars.get(i)!
      if (isStringLikeKind(item.key) && originals.prop?.length) {
        const key = getStringValue(item.key)
        const fn = arrowFunctionExpression(variables, item.value as types.Expression)
        ast.push(types.objectProperty(types.stringLiteral(key), fn))
      } else {
        ast.push(item)
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
  const { importIdentifiers, attach, anchor } = ctx
  const variable = path.scope.generateUidIdentifier('styles')
  const expression = value.get('expression')
  if (!expression.isObjectExpression()) throw new Error('[stylex-extend]: can\'t pass not object value for attribute \'stylex\'.')
  const CSSContext = createCSSContext(expression.node.properties.length, anchor)
  scanObjectExpression(expression, CSSContext)
  const CSSAST = evaluateCSSAST(convertToAST(CSSContext.rules), CSSContext)
  const expr: Array<types.Expression> = []
  for (const prop of CSSAST.properties) {
    if (prop.type === 'ObjectProperty') {
      expr.push(types.memberExpression(variable, prop.key, true))
    }
  }
  for (const [pos, { originals }] of CSSContext.vars) {
    for (const kind in originals) {
      if (kind === 'prop') {
        const previous = expr[pos]
        if (!previous) continue
        if (previous.type === 'MemberExpression') {
          const nodes = originals[kind]
          expr[pos] = callExpression(previous, nodes!.map(n => n.node))
        }
      }
      if (kind === 'spared') {
        const [node] = originals[kind]!
        expr[pos] = types.logicalExpression('&&', node.node, expr[pos])
      }
    }
  }
  ctx.lastBindingPos = CSSContext.state.lastBindingPos
  const stylexDeclaration = variableDeclaration(variable, callExpression(importIdentifiers.create, [CSSAST]))
  ctx.stmts.push(stylexDeclaration)
  path.replaceWith(types.jsxSpreadAttribute(callExpression(attach, expr)))
}
