// evaluate css with JS AST
// There are three steps
// 1. Scan input JS AST and transform as css rules.
// 2. Compose css rules to a whole JS Object. At the same time, do generation optmization
// 3. Generate final JS AST (ensure node order)

import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { utils } from '@stylexjs/shared'
import type { CSSObjectValue } from '../interface'
import {
  arrowFunctionExpression,
  callExpression,
  getStringLikeKindValue,
  is,
  isIdentifier,
  isMemberExpression,
  isObjectExpression,
  isObjectProperty,
  isSpreadElement,
  isStringLikeKind,
  memberExpression,
  objectExpression,
  objectProperty,
  stringLiteral
} from './shared'
import { MESSAGES } from './message'

interface CSSRule {
  rule: CSSObjectValue
  isReference: boolean
  isSpread: boolean
  vairableNames: Set<string>
}

// Mark is a collection that help us to define dynamic value in css object.
// All dynamic token should be consumed at transform as JS AST step.
export const MARK = {
  reference: (s: string) => '_#' + s,
  isReference: (s: string) => s.startsWith('_#'),
  referenceSymbol: 'referenceName'
}

function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function hash(s: string) {
  return 'a' + utils.hash(s)
}

function union(...c: Set<string>[]) {
  // @ts-expect-error
  return new Set(c.reduce((acc, set) => [...acc, ...set], []))
}

const handleObjectProperty = (key: string, value: types.Expression) => {
  return objectProperty(stringLiteral(key), value)
}

function handleIdentifier(path: NodePath<types.Node>) {
  if (!isIdentifier(path)) return
  return { path, define: path.node.name }
}

function handleMemebreExpression(path: NodePath<types.Node>) {
  if (!isMemberExpression(path)) return
  const obj = path.get('object')
  const prop = path.get('property')
  if (isIdentifier(obj) && isStringLikeKind(prop)) {
    // Prevent the same name as identifier
    const define = getStringLikeKindValue(obj) + capitalizeFirstLetter(getStringLikeKindValue(prop)) 
    return { path, define: MARK.reference(define) }
  }
}

function handleCallExpression(path: NodePath<types.Node>) {
  if (!path.isCallExpression()) return
  const callee = path.get('callee')
  const result = handleIdentifier(callee) || handleMemebreExpression(callee)
  if (!result) return
  return {
    define: MARK.isReference(result.define) ? result.define : MARK.reference(result.define),
    path
  }
}

function cleanupDuplicateASTNode(paths: NodePath<types.Node>[], sortBy: string[] = []) {
  const buckets: NodePath<types.Expression>[] = []
  const scenes = new Set<string>()
  for (const path of paths) {
    const define = path.getData(MARK.referenceSymbol)
    if (!define) continue
    if (!scenes.has(define)) {
      buckets.push(path as NodePath<types.Expression>)
      scenes.add(define)
    }
  }
  return buckets.sort((a, b) => {
    const sceneA = sortBy.indexOf(a.getData(MARK.referenceSymbol))
    const sceneB = sortBy.indexOf(b.getData(MARK.referenceSymbol))
    return sceneA - sceneB
  }).map((p) => p.node)
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
      } else if (MARK.isReference(value)) {
        ast = types.identifier(value.slice(2))
      } else {
        ast = types.stringLiteral(value)
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

function convertToAST(rule: CSSObjectValue) {
  const ast: types.ObjectProperty[] = []

  for (const attr in rule) {
    const value = rule[attr]
    if (typeof value === 'object' && value !== null) {
      const childAST = convertToAST(value)
      ast.push(handleObjectProperty(attr, childAST))
    } else {
      const v = ensureCSSValueASTKind(value)
      ast.push(handleObjectProperty(attr, v))
    }
  }
  return objectExpression(ast)
}

// recursion is expensive, so we have to be patient when recording css referenecs.
class CSSParser {
  jsAST: NodePath<types.ObjectExpression>
  counter: number
  rules: Array<CSSRule>
  cssReferences: Map<number, NodePath<types.Node>[]>
  duplicateDeclaration: Set<string>
  variable: types.Identifier

  constructor(jsAST: NodePath<types.ObjectExpression>) {
    this.jsAST = jsAST
    this.counter = 0
    this.rules = []
    this.cssReferences = new Map()
    this.duplicateDeclaration = new Set()
    this.variable = this.jsAST.scope.generateUidIdentifier('styles')
  }

  private recordCSSReference(path: NodePath<types.Node>, defineName?: string) {
    let result = handleIdentifier(path) || handleMemebreExpression(path) || handleCallExpression(path) as { define: string, path: NodePath<types.Node> }
    if (defineName && !result) result = { path, define: defineName }
    if (!result) return
    path.setData(MARK.referenceSymbol, result.define)
    if (this.cssReferences.has(this.counter)) {
      const previous = this.cssReferences.get(this.counter)!
      if (!this.duplicateDeclaration.has(result.define)) {
        this.cssReferences.set(this.counter, [...previous, result.path])
        this.duplicateDeclaration.add(result.define)
      }
    } else {
      this.cssReferences.set(this.counter, [result.path])
      this.duplicateDeclaration.add(result.define)
    }
  }

  private parseObjectProperty(path: NodePath<types.ObjectProperty>): Partial<CSSRule> {
    is(path.get('computed'), MESSAGES.NO_STATIC_ATTRIBUTE)
    const attribute = path.get('key')
    const valuePath = path.get('value')
    if (!isStringLikeKind(attribute)) throw new Error(MESSAGES.NO_STATIC_ATTRIBUTE)
    const { value } = path.node
    const CSSObject: CSSObjectValue = {}
    const attr = getStringLikeKindValue(attribute)
    let isReference = false
    
    switch (value.type) {
      case 'NullLiteral':
        CSSObject[attr] = null
        break
      case 'Identifier':
        if (value.name === 'undefined') CSSObject[attr] = undefined
        else {
          CSSObject[attr] = MARK.reference(value.name)
          isReference = true
          this.recordCSSReference(valuePath)
        }
        break
      case 'StringLiteral':
      case 'NumericLiteral':
        CSSObject[attr] = value.value
        break
      case 'TemplateLiteral':
      case 'ConditionalExpression': {
        if (value.type === 'TemplateLiteral' && !value.expressions.length) {
          CSSObject[attr] = value.quasis[0].value.raw
        } else {
          const value = MARK.reference(hash(attr))
          CSSObject[attr] = value
          isReference = true
          this.recordCSSReference(valuePath, value)
        }
        break
      }
      case 'MemberExpression': {
        if (!valuePath.isMemberExpression()) break
        const result = handleMemebreExpression(valuePath)!
        CSSObject[attr] = result.define
        isReference = true
        this.recordCSSReference(valuePath)
        break
      }
      case 'CallExpression':
        if (valuePath.isCallExpression()) {
          const { define } = handleCallExpression(valuePath)!
          CSSObject[attr] = define
          isReference = true
          this.recordCSSReference(valuePath)
        }
        break
      case 'ObjectExpression': {
        if (isObjectExpression(valuePath)) {
          let isReference = false
          for (const prop of valuePath.get('properties')) {
            is(!isSpreadElement(prop), MESSAGES.NO_NESTED_SPREAD)
            if (isObjectProperty(prop)) {
              const { rule, isReference: _isReference } = this.parseObjectProperty(prop)
              if (_isReference) isReference = true
              Object.assign(CSSObject, rule)
            }
          }
          return { rule: { [attr]: CSSObject }, isReference, isSpread: false }
        }
      }
    }
    return { rule: CSSObject, isReference, isSpread: false }
  }

  private parseSpreadElement(path: NodePath<types.SpreadElement>): Partial<CSSRule> {
    const arg = path.get('argument')
    if (isObjectExpression(arg)) {
      const CSSObject: CSSObjectValue = {}
      let isReference = false
      for (const prop of arg.get('properties')) {
        is(!isSpreadElement(prop), MESSAGES.NO_NESTED_SPREAD)
        if (prop.isObjectProperty()) {
          const { rule, isReference: _isReference } = this.parseObjectProperty(prop)
          if (_isReference) isReference = true
          Object.assign(CSSObject, rule)
        }
      }
      return { rule: CSSObject, isReference, isSpread: false }
    }
    if (arg.isLogicalExpression()) {
      is(arg.node.operator === '&&', MESSAGES.ONLY_LOGICAL_AND)
      const right = arg.get('right')
      if (!isObjectExpression(right)) throw new Error(MESSAGES.INVALID_SPREAD_SIDE)
      const CSSObject: CSSObjectValue = {}
      let isReference = false
      for (const prop of right.get('properties')) {
        is(!isSpreadElement(prop), MESSAGES.NO_NESTED_SPREAD)
        if (prop.isObjectProperty()) {
          const { rule, isReference: _isReference } = this.parseObjectProperty(prop)
          if (_isReference) isReference = true
          Object.assign(CSSObject, rule)
        }
      }
      this.recordCSSReference(arg.get('left'), hash(JSON.stringify(CSSObject)))
      return { rule: CSSObject, isReference, isSpread: true }
    }
    throw new Error(MESSAGES.NOT_IMPLEMENETED)
  }

  parse() {
    const properties = this.jsAST.get('properties')
    for (let i = 0; i < properties.length; i++) {
      const path = properties[i]
      const rule = isObjectProperty(path) ? this.parseObjectProperty(path) : isSpreadElement(path) ? this.parseSpreadElement(path) : null
      if (typeof rule === 'object' && rule) {
        this.rules.push({ ...rule as CSSRule, vairableNames: union(this.duplicateDeclaration) })
      }
      if (isSpreadElement(path)) {
        this.duplicateDeclaration.clear()
      }
      this.counter++
    }
  }

  toJSAST() {
    // 1. merge css
    // 2. evaluate css reference
    // 3. if reference is exists, hoist them and generate arrowFunction AST
    if (!this.rules.length) return 
    let step = 0
    let section = 0
    const mergedCSSRules: Array<Pick<CSSRule, 'rule' | 'vairableNames' | 'isSpread'> & { referencePaths: NodePath<types.Node>[] }> = []
    
    while (step < this.counter) {
      const { rule, isReference, isSpread, vairableNames } = this.rules[step]
      const referencePaths: NodePath<types.Node>[] = []
      if (isSpread) section++
      if (isReference || isSpread) {
        // pick up epxression
        if (this.cssReferences.has(step)) {
          referencePaths.push(...this.cssReferences.get(step)!)
        }
      }
      if (!mergedCSSRules.length || section >= mergedCSSRules.length) {
        mergedCSSRules.push({ rule, vairableNames, referencePaths, isSpread })
      } else {
        mergedCSSRules[section].rule = { ...mergedCSSRules[section].rule, ...rule }
        mergedCSSRules[section].vairableNames = union(mergedCSSRules[section].vairableNames, vairableNames)
        mergedCSSRules[section].referencePaths = [...mergedCSSRules[section].referencePaths, ...referencePaths]
        mergedCSSRules[section].isSpread = isSpread
      }
      if (isSpread) section++
      step++
    }

    const propertyAST: types.ObjectProperty[] = []
    const expressionAST: types.Expression[] = []
  
    // Don't forget to handle reference
    for (let i = 0; i < mergedCSSRules.length; i++) {
      const CSSRule = mergedCSSRules[i]
      const { rule, referencePaths, vairableNames, isSpread } = CSSRule
      const jsAST = convertToAST(rule)
      const expression = memberExpression(this.variable, stringLiteral('#' + i), true)
      if (vairableNames.size) {
        const variables = [...vairableNames]
        let condit = null
        if (isSpread) {
          variables.pop()
          condit = referencePaths.pop()
        }
        const calleeArguments = cleanupDuplicateASTNode(referencePaths, variables)
        const callee = callExpression(expression, calleeArguments)
        if (condit) {
          expressionAST.push(types.logicalExpression('&&', condit.node as types.Expression, variables.length ? callee : expression))
        } else {
          expressionAST.push(callee)
        }
        if (variables.length) {
          const fnAST = arrowFunctionExpression(variables.map((s) => types.identifier(MARK.isReference(s) ? s.slice(2) : s)), jsAST)
          propertyAST.push(handleObjectProperty('#' + i, fnAST))
        } else {
          propertyAST.push(handleObjectProperty('#' + i, jsAST))
        }
        continue  
      }
      propertyAST.push(handleObjectProperty('#' + i, jsAST))
      expressionAST.push(expression)
    }

    return [objectExpression(propertyAST), this.variable, expressionAST, mergedCSSRules] as const
  }
}

// Only expression nodes can be scanned.

export function scanObjectExpression(path: NodePath<types.Node>) {
  if (!isObjectExpression(path)) throw new Error(MESSAGES.INVALID_CSS_AST_KIND)
  const cssparser = new CSSParser(path)
  cssparser.parse()
  return cssparser.toJSAST()
}
