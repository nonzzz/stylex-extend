import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { utils } from '@stylexjs/shared'

// eslint-disable-next-line sort-imports
import { importPathResolver, Module } from '../module'
import {
  findNearestParentWithCondition,
  getStringLikeKindValue,
  isBooleanLiteral,
  isCallExpression,
  isConditionalExpression,
  isIdentifier,
  isImportDeclaration,
  isImportDefaultSpecifier,
  isImportNamespaceSpecifier,
  isImportSpecifier,
  isLogicalExpression,
  isMemberExpression,
  isNullLiteral,
  isNumericLiteral,
  isObjectExpression,
  isObjectMethod,
  isObjectProperty,
  isReferencedIdentifier,
  isSpreadElement,
  isStringLikeKind,
  isStringLiteral,
  isTemplateLiteral,
  isUnaryExpression,
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

function evaluate(path: NodePath<types.Identifier>, state: State): string | undefined
function evaluate(path: NodePath<types.NullLiteral>, state: State): null
function evaluate(path: NodePath<types.StringLiteral>, state: State): string
function evaluate(path: NodePath<types.NumericLiteral>, state: State): number
function evaluate(path: NodePath<types.BooleanLiteral>, state: State): boolean
function evaluate(path: NodePath<types.MemberExpression>, state: State): string | undefined
function evaluate(path: NodePath<types.TemplateLiteral>, state: State): string
function evaluate(path: NodePath<types.ConditionalExpression>, state: State): string
function evaluate(path: NodePath<types.CallExpression>, state: State): string | undefined
function evaluate(path: NodePath<types.ObjectExpression>, state: State): CSSObjectValue
function evaluate(path: NodePath<types.LogicalExpression>, state: State): CSSObjectValue
function evaluate(path: NodePath<types.Node>, state: State): CSSObjectValue
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

  if (isUnaryExpression(path, { prefix: true })) {
    if (path.node.operator === 'void') {
      // we don't need to evaluate the argument to know what this will return
      return undefined
    }
    const args = path.get('argument')
    const arg = evaluate(args, state)
    switch (path.node.operator) {
      case '!':
        return !arg
      case '+':
        return +arg
      case '-':
        return -arg
      case '~':
        return ~arg
      case 'typeof':
        return typeof arg
    }
    return undefined
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
    if (isMemberExpression(callee)) {
      const result = evaluateMemberExpression(callee, state)
      if (result) {
        const unwrapped = MARK.unref(result)
        state.environment.references.set(unwrapped, { path, define: unwrapped })
      }
      return result
    }
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
    // stylex will evaluate all logical expr so we no need to worry about it.
    const right = evaluateForState(path.get('right'), state)
    state.environment.references.set(MARK.ref(state.layer), { path: path.get('left'), define: MARK.ref(state.layer) })
    return right
  }
}

function evaluateForState(path: NodePath<types.Node>, state: State) {
  const value = evaluate(path, state)
  return value
}

function evaluatePath(path: NodePath<types.Node>, mod: Module): Result {
  const state: State = {
    confident: true,
    deoptPath: null,
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

  // dprint-ignore
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
      const [child, vars] = printCSSRule(value)
      properties.push(make.objectProperty(key, child))
      vars.forEach(v => variables.add(v))
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

export function printJsAST(data: ReturnType<typeof sortAndMergeEvaluatedResult>, path: NodePath<types.ObjectExpression>) {
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
        expressions.push(make.logicalExpression('&&', references.get(MARK.ref(i))!.path.node! as types.Expression, callee))
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

export function printCssAST(data: ReturnType<typeof sortAndMergeEvaluatedResult>, mod: Module) {
  let str = ''
  const { references, css } = data

  const print = (s: string | number) => {
    str += s
  }

  const evaluateCSSVariableFromModule = (path: NodePath<types.MemberExpression>) => {
    const obj = path.get('object')
    const prop = path.get('property')
    if (isReferencedIdentifier(obj) && isIdentifier(prop)) {
      const binding = path.scope.getBinding(obj.node.name)
      const bindingPath = binding?.path
      if (
        binding && bindingPath && isImportSpecifier(bindingPath) && !isImportDefaultSpecifier(bindingPath) &&
        !isImportNamespaceSpecifier(bindingPath)
      ) {
        const importSpecifierPath = bindingPath
        const imported = importSpecifierPath.node.imported
        const importDeclaration = findNearestParentWithCondition(importSpecifierPath, isImportDeclaration)
        const abs = importPathResolver(importDeclaration.node.source.value, mod.filename, {
          unstable_moduleResolution: mod.options.unstable_moduleResolution,
          aliases: mod.options.aliases
        })
        if (!abs) {
          throw new Error(MESSAGES.NO_STATIC_ATTRIBUTE)
        }
        // eslint-disable-next-line no-unused-vars
        const [_, value] = abs
        const strToHash = utils.genFileBasedIdentifier({
          fileName: value,
          exportName: getStringLikeKindValue(imported),
          key: prop.node.name
        })
        return `var(--${mod.options.classNamePrefix + utils.hash(strToHash)})`
      }
    }
    throw new Error(MESSAGES.NOT_IMPLEMENTED)
  }

  const evaluateLivingVariable = (value: string) => {
    const unwrapped = MARK.unref(value)
    const { path } = references.get(unwrapped)!
    if (isMemberExpression(path)) {
      return evaluateCSSVariableFromModule(path)
    }
    if (isTemplateLiteral(path)) {
      const { quasis } = path.node
      const expressions = path.get('expressions')
      let cap = expressions.length
      let str = quasis[0].value.raw
      while (cap) {
        const first = expressions.shift()!
        if (first && isMemberExpression(first)) {
          str += evaluateCSSVariableFromModule(first)
        }
        cap--
      }
      return str
    }
    throw new Error(MESSAGES.NOT_IMPLEMENTED)
  }

  const prettySelector = (selector: string) => {
    if (selector.charCodeAt(1) === 45) {
      return selector
    }
    return selector.replace(/[A-Z]|^ms/g, '-$&').toLowerCase()
  }

  const run = (rule: CSSObjectValue[] | CSSObjectValue) => {
    if (Array.isArray(rule)) {
      for (const r of rule) {
        run(r)
      }
      return
    }
    for (const { key: selector, value } of new Iter(rule)) {
      if (typeof value === 'boolean') continue
      if (typeof value === 'undefined' || typeof value === 'object' && !value) continue
      if (typeof value === 'object') {
        print(selector)
        print('{')
        run(value)
        print('}')
        continue
      }
      print(prettySelector(selector))
      print(':')
      if (typeof value === 'string' && MARK.isRef(value)) {
        print(evaluateLivingVariable(value))
      } else {
        print(value)
      }
      print(';')
    }
  }

  run(css)

  return { css: str }
}

function sortAndMergeEvaluatedResult(data: Result) {
  const { value, references } = data
  const iter = new Iter(value)
  const result: CSSObjectValue[] = []
  let layer = 0
  let layer2 = 0
  let confident = false
  const nodes: Array<{ node: types.LogicalExpression; layer: number }> = []
  for (const item of iter) {
    const { key, value } = item
    layer = layer2

    if (!MARK.isRef(key)) {
      if (result[layer] && WITH_LOGICAL in result[layer]) {
        layer++
      }
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
        if (result.length > 0) {
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
