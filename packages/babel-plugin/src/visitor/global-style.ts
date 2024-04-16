// API InjectGlobalStyle
// syntax: injectGlobalStyle()

import { types } from '@babel/core'
import { utils } from '@stylexjs/shared'
import type { NodePath } from '@babel/core'
import type { CSSObject } from '@stylex-extend/shared'
import type { Context } from '../state-context'
import type { CSSObjectValue } from '../interface'
import { CSSContext, createCSSContext, scanObjectExpression } from './jsx-attribute'

// This function is base on the @stylexjs/shared defineVars
//  themeName: utils.genFileBasedIdentifier({ fileName, exportName }),
function getCSSVarName(key: string, seed: string) {
  if (key[0] === '_' && key[1] === '#') {
    return `var(--${seed + utils.hash(key.slice(2))})`
  }
  return key
}

function traverseCSSObject(CSSRule: CSSObjectValue, seed: string) {
  const obj = {}
  if (!CSSRule) return obj
  for (const selector in CSSRule) {
    const decls = CSSRule[selector]
    const next = {}
    if (!decls || typeof decls !== 'object') continue
    for (const decl in decls) {
      const attr = decls[decl]
      switch (typeof attr) {
        case 'object':
          Object.assign(next, traverseCSSObject(attr!, seed))
          break
        case 'string': {
          Object.assign(next, { [decl]: getCSSVarName(attr, seed) })
          break
        }
        default:
          Object.assign(next, { [decl]: attr })
      }
    }
    Object.assign(obj, { [selector]: next })
  }

  return obj
}

export function CombiningStyleSheets(CSSContext: CSSContext, seed: string) {
  const CSSRules = CSSContext.rules
  const sheets: Record<string, CSSObject> = {}
  for (const CSSRule of CSSRules) {
    Object.assign(sheets, traverseCSSObject(CSSRule, seed))
  }
  return sheets
}

export function transformInjectGlobalStyle(path: NodePath<types.CallExpression>, ctx: Context) {
  const { node } = path
  if (!node || node.callee.type !== 'Identifier' || !ctx.imports.has(node.callee.name)) return
  const args = path.get('arguments')
  if (args.length > 1) throw new Error(`[stylex-extend]: ${node.callee.name} only accept one argument`)
  if (!args[0].isObjectExpression()) throw new Error('[stylex-extend]: can\'t pass not object value for attribute \'stylex\'.')
  const { anchor, options } = ctx
  const { classNamePrefix } = options
  const expression = args[0]
  const CSSContext = createCSSContext(expression.node.properties.length, anchor)
  scanObjectExpression(expression, CSSContext)
  const sheets = CombiningStyleSheets(CSSContext, classNamePrefix)
  console.log(sheets)
}
