// evaluate css with JS AST
// There are three steps
// 1. Scan input JS AST and transform as css rules.
// 2. Compose css rules to a whole JS Object. At the same time, do generation optmization
// 3. Generate final JS AST

import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import type { CSSObjectValue } from '../interface'
import { arrowFunctionExpression, getStringLikeKindValue, is, isIdentifier, isMemberExpression, isObjectExpression, isObjectProperty, isSpreadElement, isStringLikeKind } from './shared'
import { MESSAGES } from './message'

interface CSSRule {
  rule: CSSObjectValue
  isReference: boolean
  isSpread: boolean
  vairableNames: Set<string>
}

// Mark is a collection that help us to define dynamic value in css object.
// All dynamic token should be consumed at transform as JS AST step.
const MARK = {
  reference: (s: string) => '_#' + s,
  isReference: (s: string) => s.startsWith('_#')
}

function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
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
      ast.push(types.objectProperty(types.stringLiteral(attr), childAST))     
    } else {
      const v = ensureCSSValueASTKind(value)
      ast.push(types.objectProperty(types.stringLiteral(attr), v))
    }
  }
  return types.objectExpression(ast)
}

// recursion is expensive, so we have to be patient when recording css referenecs.
class CSSParser {
  jsAST: NodePath<types.ObjectExpression>
  counter: number
  rules: Array<CSSRule>
  cssReferences: Map<number, any[]>
  duplicateDeclaration: Set<string>

  constructor(jsAST: NodePath<types.ObjectExpression>) {
    this.jsAST = jsAST
    this.counter = 0
    this.rules = []
    this.cssReferences = new Map()
    this.duplicateDeclaration = new Set()
  }

  private recordCSSReference(path: NodePath<types.Node>) {
    const handleIdentifier = (path: NodePath<types.Node>) => {
      if (!isIdentifier(path)) return
      return { path, define: path.node.name }
    }

    const handleMemebreExpression = (path: NodePath<types.Node>) => {
      if (!isMemberExpression(path)) return
      const obj = path.get('object')
      const prop = path.get('property')
      if (isIdentifier(obj) && isStringLikeKind(prop)) {
        // Prevent the same name as identifier
        const define = getStringLikeKindValue(obj) + capitalizeFirstLetter(getStringLikeKindValue(prop)) 
        return { path, define: MARK.reference(define) }
      }
    }

    const reuslt = handleIdentifier(path) || handleMemebreExpression(path)
    if (!reuslt) return
    if (this.cssReferences.has(this.counter)) {
      const previous = this.cssReferences.get(this.counter)!
      if (!this.duplicateDeclaration.has(reuslt.define)) {
        this.cssReferences.set(this.counter, [...previous, reuslt.path])
        this.duplicateDeclaration.add(reuslt.define)
      }
    } else {
      this.cssReferences.set(this.counter, [reuslt.path])
      this.duplicateDeclaration.add(reuslt.define)
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
      case 'ConditionalExpression':
        break
      case 'MemberExpression': {
        if (!valuePath.isMemberExpression()) break
        const obj = valuePath.get('object')
        const prop = valuePath.get('property')
        if (isIdentifier(obj) && isStringLikeKind(prop)) {
          CSSObject[attr] = MARK.reference(getStringLikeKindValue(obj) + capitalizeFirstLetter(getStringLikeKindValue(prop)))
          isReference = true
          this.recordCSSReference(valuePath)
        }
        break
      }
      case 'CallExpression':
        // 
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
      this.recordCSSReference(arg.get('left'))
      return { rule: CSSObject, isReference, isSpread: true }
    }
    throw new Error(MESSAGES.NOT_IMPLEMENETED)
  }

  parse() {
    const properties = this.jsAST.get('properties')
    for (let i = 0; i < properties.length; i++) {
      this.duplicateDeclaration.clear()
      const path = properties[i]
      const rule = isObjectProperty(path) ? this.parseObjectProperty(path) : isSpreadElement(path) ? this.parseSpreadElement(path) : null
      if (typeof rule === 'object' && rule) {
        this.rules.push({ ...rule as CSSRule, vairableNames: this.duplicateDeclaration })
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
    const mergedCSSRules: Array<{ rule: CSSObjectValue, asts: types.Node[] }> = []
    while (step < this.counter) {
      const { rule, isReference, isSpread, vairableNames } = this.rules[step]
      if (isSpread) section++
      console.log(vairableNames)
      if (!mergedCSSRules.length || section > mergedCSSRules.length) {
        mergedCSSRules.push({ rule, asts: [] })
      } else {
        mergedCSSRules[section].rule = { ...mergedCSSRules[section].rule, ...rule }
        mergedCSSRules[section].asts = [...mergedCSSRules[section].asts, ...this.cssReferences.get(step) ?? []]
      }
      step++
    }
    // merge set ast
    // while (step < this.counter) {
    //   const asts: types.Node[] = []
    //   const { rule, isReference, isSpread } = this.rules[step]
    //   if (isSpread) section++
    //   // Not a good way, When tree level depth is very deep.
    //   // analyze each stmt reference
    //   if (isReference || isSpread) {
    //     const stmt = stmts[step]
    //     // eslint-disable-next-line no-unused-vars
    //     const inScope = false
    //     stmt.traverse({
    //       // MemberExpression(path) {
    //       //   // path.skip()
    //       // },
    //       // ObjectProperty(path) {
    //       //   const valuePath = path.get('value')
    //       //   if (isIdentifier(valuePath)) {
    //       //     asts.push(valuePath.node)
    //       //   }
    //       // },
    //       // SpreadElement: {
    //       //   enter(path) {
    //       //     inScope = true
    //       //   },
    //       //   exit(path) {
    //       //     inScope = false
    //       //   }
    //       // }
    //       Identifier(p) {
    //         asts.push(p.node)
    //       }
    //     })
    //   }
    //   if (!mergedCSSRules.length || section > mergedCSSRules.length) {
    //     mergedCSSRules.push({ rule, asts })
    //   } else {
    //     mergedCSSRules[section].rule = { ...mergedCSSRules[section].rule, ...rule }
    //     mergedCSSRules[section].asts = [...mergedCSSRules[section].asts, ...asts]
    //   }
    //   step++
    // }

    // const aa = []
    // for (let i = 0; i < mergedCSSRules.length; i++) {
    //   const CSSRule = mergedCSSRules[i]
    //   const { asts, rule } = CSSRule
    //   console.log(asts)
    //   if (asts.length > 0) {
    //     // wrapper as arrow function
    //     const ast = convertToAST(rule)
    //     const variables = asts.filter(ast => ast.type === 'Identifier') as types.Identifier[]
    //     // traverse css rules and replace reference 
    //     const fn = arrowFunctionExpression(variables, ast)
    //     const v = types.objectExpression([types.objectProperty(types.stringLiteral('#' + i), fn)])
    //     aa.push(v)
    //     continue  
    //   } else {
    //     const ast = convertToAST(rule)
    //     const v = types.objectExpression([types.objectProperty(types.stringLiteral('#' + i), ast)])
    //     aa.push(v)
    //   }
    // }
    // return aa
  }
}

// Only expression nodes can be scanned.

export function scanObjectExpression(path: NodePath<types.Node>) {
  if (!isObjectExpression(path)) throw new Error(MESSAGES.INVALID_CSS_AST_KIND)
  const cssparser = new CSSParser(path)
  cssparser.parse()
  return cssparser.toJSAST()
}
