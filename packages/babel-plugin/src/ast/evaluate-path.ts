import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { utils } from '@stylexjs/shared'
import { Module } from '../module'
import {
  findNearestParentWithCondition,
  getStringLikeKindValue,
  isBooleanLiteral,
  isCallExpression,
  isConditionalExpression,
  isIdentifier,
  isLogicalExpression,
  isMemberExpression,
  isNullLiteral,
  isNumericLiteral,
  isObjectExpression,
  isObjectMethod,
  isObjectProperty,
  isSpreadElement,
  isStringLikeKind,
  isStringLiteral,
  isTemplateLiteral,
  make
} from '../ast/shared'
import type { CSSObjectValue } from '../interface'
import { MESSAGES } from '../ast/message'

interface EnvironmentMap {
  path: NodePath<types.Node>
  define: string
}

export interface Environment {
  references: Map<string, EnvironmentMap>
}

export interface State {
  confident: boolean
  deoptPath: NodePath<types.Node> | null
  seen: Map<types.Node, any>
  addedImports: Set<string>
  environment: Environment
  layer: number
  mod: Module
}

export interface Result {
  confident: boolean
  value: CSSObjectValue
  references: Map<string, EnvironmentMap>
}

const WITH_LOGICAL = '__logical__'

export const MARK = {
  ref: (s: string | number) => '@__' + s,
  unref: (s: string) => s.slice(3),
  isRef: (s: string) => s.startsWith('@__')
}

function hash(s: string) {
  return 'a' + utils.hash(s)
}

function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function evaluateMemberExpression(path: NodePath<types.MemberExpression>, state: State) {
  const objPath = path.get('object')
  const propPath = path.get('property')
  if (isIdentifier(objPath) && isStringLikeKind(propPath)) {
    const id = getStringLikeKindValue(objPath) + capitalizeFirstLetter(getStringLikeKindValue(propPath))
    state.environment.references.set(id, { path, define: id })
    return MARK.ref(id)
  }
}

function evaluateNodeToHashLike(path: NodePath<types.Node>, state: State) {
  const identifier = findNearestParentWithCondition(path, isObjectProperty).get('key')
  // @ts-expect-error
  const id = hash(getStringLikeKindValue(identifier))
  state.environment.references.set(id, { path, define: id })
  return MARK.ref(id)
}

function evaluateTemplateLiteral(path: NodePath<types.TemplateLiteral>, state: State) {
  const expr = path.get('expressions')
  if (!expr.length) {
    return path.node.quasis[0].value.raw
  }
  return evaluateNodeToHashLike(path, state)
}

// About difference. us evaluate will split two logic. one is evaluate object expression. another is evaluate baisc expression.
// Like number, string, boolean, null, undefined, etc.
// Unlike stylex. we must ensure the object expression if it's kind of object property the key must be static.
function evaluate(path: NodePath<types.Node>, state: State) {
  if (isNullLiteral(path)) {
    return null
  }

  if (isIdentifier(path)) {
    const value = path.node.name
    if (value === 'undefined') {
      return undefined
    }
    state.environment.references.set(value, { path, define: value })
    return MARK.ref(value)
  }

  if (isStringLiteral(path) || isNumericLiteral(path) || isBooleanLiteral(path)) {
    return path.node.value
  }

  if (isMemberExpression(path)) {
    return evaluateMemberExpression(path, state)
  }

  if (isTemplateLiteral(path)) {
    return evaluateTemplateLiteral(path, state)
  }

  if (isConditionalExpression(path)) {
    return evaluateNodeToHashLike(path, state)
  }

  if (isCallExpression(path)) {
    const callee = path.get('callee')
    if (isMemberExpression(callee)) return evaluateMemberExpression(callee, state)
    if (isIdentifier(callee)) {
      const value = getStringLikeKindValue(callee)
      state.environment.references.set(value, { path, define: value })
      return MARK.ref(value)
    }
  }

  if (isObjectExpression(path)) {
    const obj: CSSObjectValue = {}
    const props = path.get('properties')
    for (const prop of props) {
      if (isObjectMethod(prop)) {
        throw new Error(MESSAGES.NOT_IMPLEMENTED)
      }
      if (isSpreadElement(prop)) {
        if (!state.confident) {
          throw new Error(MESSAGES.NO_NESTED_SPREAD)
        }
        state.confident = false
        const spreadExpression = evaluateForState(prop.get('argument'), state)
        Object.assign(obj, { [MARK.ref(state.layer)]: spreadExpression })
        state.confident = true
        state.layer++
      }
      if (isObjectProperty(prop)) {
        if (prop.node.computed) {
          throw new Error(MESSAGES.NO_STATIC_ATTRIBUTE)
        }
        let key: string | undefined
        if (isStringLikeKind(prop.get('key'))) {
          // @ts-expect-error
          key = getStringLikeKindValue(prop.get('key'))
        }
        const valuePath = prop.get('value')
        const value = evaluate(valuePath, state)
        if (key) {
          obj[key] = value
        }
      }
    }
    return obj
  }

  if (isLogicalExpression(path)) {
    // TODO better type
    // stylex will evaluate all logical expr so we no need to worry about it.
    const right = evaluateForState(path.get('right'), state) as CSSObjectValue
    state.environment.references.set(MARK.ref(state.layer), { path: path.get('left'), define: MARK.ref(state.layer) })
    return right 
  }
}

function evaluateForState(path: NodePath<types.Node>, state: State) {
  const value = evaluate(path, state)
  return value
}

const paths = new WeakMap<Module, Set<string>>()

function evaluatePath(path: NodePath<types.Node>, mod: Module): Result {
  const addedImports = paths.get(mod) ?? new Set()
  paths.set(mod, addedImports)
  const state: State = {
    confident: true,
    deoptPath: null,
    addedImports,
    layer: 0,
    environment: { references: new Map() },
    seen: new Map(),
    mod
  }

  return {
    confident: state.confident,
    value: evaluateForState(path, state) as CSSObjectValue,
    references: state.environment.references
  }
}

export class Iter<T extends Record<string, unknown>> {
  private keys: string[]
  private data: T
  constructor(data: T) {
    this.data = data
    this.keys = Object.keys(data)
  }

  * [Symbol.iterator]() {
    for (let i = 0; i < this.keys.length; i++) {
      yield {
        key: this.keys[i],
        value: this.data[this.keys[i]] as T[keyof T],
        index: i
      }
    }
  }
}

function printCSSRule(rule: CSSObjectValue) {
  const iter = new Iter(rule)
  const properties: types.ObjectProperty[] = []
  const variables = new Set<string>()
  let logical = false
  for (const { key, value } of iter) {
    if (key === WITH_LOGICAL) {
      logical = true
      continue
    }
    if (typeof value === 'object' && value !== null) {
      const [child] = printCSSRule(value)
      properties.push(make.objectProperty(key, child))
      continue
    }
    switch (typeof value) {
      case 'undefined':
        properties.push(make.objectProperty(key, make.identifier('undefined')))
        break
      case 'string': {
        if (value === 'undefined') {
          properties.push(make.objectProperty(key, make.identifier('undefined')))
        } else if (MARK.isRef(value)) {
          const unwrapped = MARK.unref(value)
          variables.add(unwrapped)
          properties.push(make.objectProperty(key, make.identifier(MARK.unref(value))))
        } else {
          properties.push(make.objectProperty(key, make.stringLiteral(value)))
        }
        break
      }
      case 'object':
        properties.push(make.objectProperty(key, make.nullLiteral()))
        break
      case 'number':
        properties.push(make.objectProperty(key, make.numericLiteral(value)))
    }
  }
  return [types.objectExpression(properties), variables, logical] satisfies [types.ObjectExpression, Set<string>, boolean]
}

export function printJsAST(data: ReturnType<typeof sortAndMergeEvaluatedResult>, path: NodePath<types.ObjectExpression>, mod: Module) {
  const { references, css } = data

  const properties: types.ObjectProperty[] = []
  const expressions: types.Expression[] = []
  const into = path.scope.generateUidIdentifier('styles')

  for (let i = 0; i < css.length; i++) {
    const rule = css[i]
    const [ast, vars, logical] = printCSSRule(rule)
    const expr = make.memberExpression(into, make.stringLiteral('#' + i), true)
    if (vars.size) {
      const calleeArguments = [...vars].map(variable => {
        const { path } = references.get(variable)!
        return path.node
      }) as types.Expression[]
      const callee = make.callExpression(expr, calleeArguments)
      if (logical) {
        expressions.push(make.logicalExpression('&&', references.get(MARK.ref(i - 1))!.path.node! as types.Expression, callee))
      } else {
        expressions.push(callee)
      }
      const func = make.arrowFunctionExpression([...vars].map(variable => make.identifier(variable)), ast)
      properties.push(make.objectProperty('#' + i, func))
      continue
    }
    if (logical) {
      expressions.push(make.logicalExpression('&&', references.get(MARK.ref(i - 1))!.path.node! as types.Expression, expr))
    } else {
      expressions.push(expr)
    }
    properties.push(make.objectProperty('#' + i, ast))
  }
  return { properties, expressions, into }
}

export function printCssAST() {
  //
}

function sortAndMergeEvaluatedResult(data: Result) {
  const { value, references } = data
  const iter = new Iter(value)
  const result: CSSObjectValue[] = []
  let layer = 0
  let layer2 = 0
  let confident = false
  const nodes: Array<{ node: types.LogicalExpression, layer: number }> = []
  for (const item of iter) {
    const { key, value } = item
    layer = layer2
    if (!MARK.isRef(key)) {
      result[layer] = { ...result[layer], [key]: value }
    } else {
      if (!references.has(key)) {
        result[layer] = { ...result[layer], ...value as CSSObjectValue }
        continue  
      }

      const path = references.get(key)?.path as NodePath<types.LogicalExpression>

      if (nodes.length && nodes.some(({ node }) => types.isNodesEquivalent(path.node, node))) {
        const layer = nodes.find(({ node }) => types.isNodesEquivalent(path.node, node))?.layer ?? 0
        result[layer] = { ...result[layer], ...value as CSSObjectValue }
      } else {
        if (result.length > 0 && !confident) {
          layer++
          confident = true
        }
        result[layer] = { ...value as CSSObjectValue, [WITH_LOGICAL]: true }
      }
      if (confident) {
        layer = layer2
      }
      layer++
      layer2 = layer
      nodes.push({ node: path.node, layer })
    }
  }
  return { references, css: result }
}

// steps:
// 1. traverse object properties and evaluate each value.
// 2. evaluate each node and insert into a ordered collection.
// 3. try to merge the logical expression or override the style object.
// 4. convert vanila collection to css object. (note is not an AST expression)
// 5. convert css object to JS AST expression. (for stylex)

export function evaluateCSS(path: NodePath<types.ObjectExpression>, mod: Module) {
  return sortAndMergeEvaluatedResult(evaluatePath(path, mod))
}
