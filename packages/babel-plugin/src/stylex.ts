import { NodePath, PluginPass, types } from '@babel/core'
import type { CssObjectValue } from './interface'
import { Context } from './state-context'

type t = typeof types

interface VariableMeta {
  ast: types.Identifier | types.MemberExpression | types.ObjectExpression
  reference?: types.Identifier | types.MemberExpression
}

interface DynamicMeta {
  references: Array<types.Identifier | types.MemberExpression> 
  paramters: Set<string>
}

interface Effect {
  state: boolean
  nested: boolean
  condit: boolean
  dynamicParamters: Set<string>
  dynamicReferences: Array<types.Identifier | types.MemberExpression>
  ast: types.ArrowFunctionExpression | undefined
  variables: Map<string, VariableMeta>
  parameters: Set<string>
  conditionds: Map<types.Expression, { css: CssObjectValue, dynamic: DynamicMeta }>
  cleanp(): void
}

const defualtEffect = { state: false,
  ast: undefined,
  nested: false,
  condit: false,
  dynamicReferences: []
}

const effect = <Effect>{
  state: false,
  nested: false,
  ast: undefined,
  condit: false,
  dynamicParamters: new Set(),
  dynamicReferences: [],
  parameters: new Set(),
  variables: new Map(),
  conditionds: new Map(),
  cleanp() {
    Object.assign(effect, defualtEffect)
    this.variables.clear()
    this.parameters.clear()
    this.conditionds.clear()
    this.dynamicParamters.clear()
  }
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

function evaluateObjectExpression(expression: types.ObjectExpression, t: typeof types, parentKey = '') {
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
          if (effect.state && effect.condit) {
            effect.dynamicParamters.add(processAttributeName(key))
            effect.dynamicReferences.push(property.value as types.Identifier | types.MemberExpression)
          }
        }
        continue
      }
      case 'SpreadElement': {
        const arg = property.argument
        switch (arg.type) {
          case 'ObjectExpression': {
            Object.assign(cssObject, evaluateObjectExpression(arg, t, parentKey))
            continue
          }
          case 'LogicalExpression': {
            if (arg.operator === '&&') {
              const { left, right } = arg
              if (right.type !== 'ObjectExpression') throw new Error('right node must be an object expression')
              effect.condit = true
              const css = evaluateObjectExpression(right, t, parentKey)
              effect.conditionds.set(left, { css, dynamic: { paramters: new Set([...effect.dynamicParamters]), references: effect.dynamicReferences } })
              effect.dynamicParamters.clear()
              effect.dynamicReferences = []
              effect.condit = false
            }
            continue
          }
        }
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

function wrapperExpressionWithStylex(ast: Array<types.Expression>, callee: string, t: typeof types, helper: types.Identifier) {
  return t.callExpression(t.memberExpression(helper, t.identifier(callee)), ast)
}

export function transformStylexObjectExpression(path: NodePath<types.JSXAttribute>, expression: types.ObjectExpression, state: PluginPass & State, t: typeof types) {
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

  // conditionds always be the last
  let count = 1
  for (const [condition, { css, dynamic }] of effect.conditionds.entries()) {
    const { references, paramters } = dynamic
    const s = t.identifier(count.toString())
    ast.properties.push(paramters.size
      ? t.objectProperty(s,
        t.arrowFunctionExpression([...paramters].map(t.identifier), convertObjectToAST(css, t, true)))
      : t.objectProperty(s, convertObjectToAST(css, t)))
    const memberExpr = t.memberExpression(variable, t.stringLiteral(count.toString()), true)
    const right = paramters.size
      ? t.callExpression(memberExpr, references)
      : memberExpr
    const logicalExpr = t.logicalExpression('&&', condition, right)
    expr.push(logicalExpr)
    count++
  }
  state.statements.push(variableDeclaration(t, variable, wrapperExpressionWithStylex([ast], 'create', t, state.helper)))

  path.replaceWith(t.jsxSpreadAttribute(wrapperExpressionWithStylex(expr, state.pluginOptions.stylex.helper, t, state.helper)))
  effect.cleanp()
}

let dynamic = false

function scanProperty(ctx: Context, path: NodePath<types.ObjectProperty>, t: t) {
  if (path.node.computed) throw new Error('[stylex-extend]: can\'t use computed property for stylex object attributes')
  const { key, value } = path.node
  if (!isStringLike(key)) throw new Error('[stylex-extend]: object key must be string')
  let nested = false

  let result
  switch (value.type) {
    case 'NullLiteral': {
      result = null
      break 
    }
    case 'Identifier': {
      if (value.name === 'undefined') {
        result = null
      } else {
        dynamic = true
        result = processAttributeName(value.name)
      }
      break 
    }
    case 'MemberExpression': {
      if (value.property.type === 'Identifier') {
        result = processAttributeName(value.property.name)
        dynamic = true
        break 
      }
      throw new Error('[stylex-extend]: can\'t use computed property for stylex object attributes')
    }
    case 'StringLiteral': {
      result = processStyleName(value.value)
      break 
    }
    case 'NumericLiteral': {
      result = value.value
      break
    }
    case 'ObjectExpression': {
      nested = true
      result = scanOjectExpression(ctx, path.get('value') as NodePath<types.ObjectExpression>, t)
      nested = false
      break
    }
  }
  if (!dynamic) return { [getStringValue(key)]: result }
  // if (!nested) {
  //   ctx.effect.paramters.add(processAttributeName(getStringValue(key)))
  //   ctx.effect.references.set(getStringValue(key), { ast: t.identifier(processAttributeName(getStringValue(key))),reference: })
  // }
  return {}
}

function scanOjectExpression(ctx: Context, path: NodePath<types.ObjectExpression>, t: t) {
  const cssObject: CssObjectValue = Object.create(null)
  for (const prop of path.get('properties')) {
    dynamic = false
    switch (prop.type) {
      case 'ObjectProperty': {
        Object.assign(cssObject, scanProperty(ctx, prop as unknown as NodePath<types.ObjectProperty>, t))
        break
      }
      case 'SpreadElement': {
        const arg = (prop.node as types.SpreadElement).argument
        if (arg.type === 'ObjectExpression') {
          Object.assign(cssObject, scanOjectExpression(ctx, prop.get('argument') as unknown as NodePath<types.ObjectExpression>, t))
        }
        break
      }
      case 'ObjectMethod': {
        throw new Error(`[stylex-extend]: can't pass function as value for '${prop.key}'`)
      }
    }
  }
  return cssObject
}

export function transformStylexAttrs(path: NodePath<types.JSXAttribute>, ctx: Context, t: t) {
  const value = path.get('value')
  if (!value.isJSXExpressionContainer()) return
  const { importIdentifiers } = ctx
  const variable = path.scope.generateUidIdentifier('styles')
  const expression = value.get('expression')
  if (!expression.isObjectExpression()) throw new Error('[stylex-extend]: can\'t pass not object value for attribute \'stylex\'.')
  const cssObject = scanOjectExpression(ctx, expression, t)
  const cssAST = convertObjectToAST({ css: cssObject }, t)
  const expr: Array<types.Expression> = [t.memberExpression(t.identifier(variable.name), t.identifier('css'))]
  const stylexDeclaration = variableDeclaration(t, variable, t.callExpression(importIdentifiers.create, [cssAST]))
  ctx.stmts.push(stylexDeclaration)
  path.replaceWith(t.jsxSpreadAttribute(t.callExpression(importIdentifiers.props, expr)))
}
