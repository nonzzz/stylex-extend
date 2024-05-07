// evaluate css with JS AST
// There are three steps
// 1. Scan input JS AST and transform as css rules.
// 2. Compose css rules to a whole JS Object. At the same time, do generation optmization
// 3. Generate final JS AST

import { NodePath, types } from '@babel/core'
import type { CSSObjectValue } from '../interface'
import { getStringLikeKindValue, is, isIdentifier, isObjectExpression, isObjectProperty, isSpreadElement, isStringLikeKind } from './shared'
import { MESSAGES } from './message'

interface CSSRule {
  rule: CSSObjectValue
  ast: NodePath<types.Node>
  isReference: boolean
  isSpread: boolean
}

// Mark is a collection that help us to define dynamic value in css object.
// All dynamic token should be consumed at transform as JS AST step.
const MARK = {
  reference: (s: string) => '_#' + s
}

class CSSParser {
  jsAST: NodePath<types.ObjectExpression>
  count: number
  rules: Array<CSSObjectValue>

  constructor(jsAST: NodePath<types.ObjectExpression>) {
    this.jsAST = jsAST
    this.count = 0
    this.rules = []
  }

  private parseObjectProperty(path: NodePath<types.ObjectProperty>) {
    is(path.get('computed'), MESSAGES.NO_STATIC_ATTRIBUTE)
    const attribute = path.get('key')
    const valuePath = path.get('value')
    if (!isStringLikeKind(attribute)) throw new Error(MESSAGES.NO_STATIC_ATTRIBUTE)
    const { value } = path.node
    const CSSObject: CSSObjectValue = {}
    const attr = getStringLikeKindValue(attribute)
    switch (value.type) {
      case 'NullLiteral':
        CSSObject[attr] = null
        break
      case 'Identifier':
        if (value.name === 'undefined') CSSObject[attr] = undefined
        else CSSObject[attr] = MARK.reference(value.name)
        break
      case 'StringLiteral':
      case 'NumericLiteral':
        CSSObject[attr] = value.value
        break
      case 'TemplateLiteral':
      case 'ConditionalExpression':
        // 
        break
      case 'MemberExpression': {
        if (!valuePath.isMemberExpression()) break
        const obj = valuePath.get('object')
        const prop = valuePath.get('property')
        if (isIdentifier(obj) && isStringLikeKind(prop)) {
          CSSObject[attr] = MARK.reference(getStringLikeKindValue(prop))
        }
        break
      }
      case 'CallExpression':
        // 
        break
      case 'ObjectExpression': {
        if (isObjectExpression(valuePath)) {
          for (const prop of valuePath.get('properties')) {
            is(isSpreadElement(prop), MESSAGES.NO_NESTED_SPREAD)
            if (prop.isObjectProperty()) Object.assign(CSSObject, this.parseObjectProperty(prop))
          }
        }
        return { [attr]: CSSObject }
      }
    }
    return CSSObject
  }

  private parseSpreadElement(path: NodePath<types.SpreadElement>) {
    const arg = path.get('argument')
    if (isObjectExpression(arg)) {
      const CSSObject: CSSObjectValue = {}
      for (const prop of arg.get('properties')) {
        is(isSpreadElement(prop), MESSAGES.NO_NESTED_SPREAD)
        if (prop.isObjectProperty()) Object.assign(CSSObject, this.parseObjectProperty(prop))
      }
      return CSSObject
    }
    if (arg.isLogicalExpression()) {
      is(arg.node.operator === '&&', MESSAGES.ONLY_LOGICAL_AND)
      //   const left = arg.get('left')
      const right = arg.get('right')
      if (!isObjectExpression(right)) throw new Error(MESSAGES.INVALID_SPREAD_SIDE)
      const CSSObject: CSSObjectValue = {}
      for (const prop of right.get('properties')) {
        is(isSpreadElement(prop), MESSAGES.NO_NESTED_SPREAD)
        if (prop.isObjectProperty()) Object.assign(CSSObject, this.parseObjectProperty(prop))
      }
      return CSSObject
    }
    throw new Error(MESSAGES.NOT_IMPLEMENETED)
  }

  parse() {
    const properties = this.jsAST.get('properties')
    for (let i = 0; i < properties.length; i++) {
      const path = properties[i]
      const rule = isObjectProperty(path) ? this.parseObjectProperty(path) : isSpreadElement(path) ? this.parseSpreadElement(path) : null
      if (typeof rule === 'object' && rule) {
        this.rules.push(rule)
      }
    }
  }

  toJSAST() {}
}

// Only expression nodes can be scanned.

export function scanObjectExpression(path: NodePath<types.Node>) {
  if (!isObjectExpression(path)) throw new Error(MESSAGES.INVALID_CSS_AST_KIND)
  const cssparser = new CSSParser(path)
  cssparser.parse()
  cssparser.toJSAST()
}
