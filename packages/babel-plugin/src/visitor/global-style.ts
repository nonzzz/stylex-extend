import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { utils } from '@stylexjs/shared'
import { compile, serialize, stringify } from 'stylis'
import { MARK, handleMemeberExpression, pickupDuplicateASTNode, scanObjectExpression } from '../ast/evaluate-css'
import type { CSSRuleWithReference } from '../ast/evaluate-css'
import { MESSAGES } from '../ast/message'
import type { CSSObjectValue } from '../interface'
import { Context } from '../state-context'
import { isTemplateLiteral } from '../ast/shared'

const KEBACASE = /[A-Z]+(?![a-z])|[A-Z]/g
function kebabCase(s: string) {
  return s.replace(KEBACASE, (_, ofs) => (ofs ? '-' : '') + _.toLowerCase())
}

function getCSSVarName(themeName: string, key: string, classNamePrefix: string) {
  return `var(--${classNamePrefix + utils.hash(`${themeName}.${key}`)})`
}

const hyphenateRegex = /[A-Z]|^ms/g

function isCustomProperty(prop: string) {
  return prop.charCodeAt(1) === 45
}

function processStyleName(prop: string) {
  return isCustomProperty(prop) ? prop : prop.replace(hyphenateRegex, '-$&').toLowerCase()
}

class Stringify {
  css: string
  ctx: Context
  rules: CSSRuleWithReference[]
  constructor(rules: CSSRuleWithReference[], ctx: Context) {
    this.css = ''
    this.ctx = ctx
    this.rules = rules
    this.parse()
  }

  print(s: string | number) {
    this.css += s
  }

  get classNamePrefix() {
    return this.ctx.options.classNamePrefix
  }

  parse() {
    for (const rule of this.rules) {
      const { referencePaths, rule: cssRule } = rule
      const jsAST = pickupDuplicateASTNode(referencePaths)
      this.run(cssRule, jsAST)
    }
  }

  evaluateCSSVariableFromStylex(s: string, jsAST: Map<string, NodePath<types.Expression>>) {
    const spliter = (s: string) => kebabCase(s.slice(2)).split('-')
    const getCssValue = (belong: string, attr: string) => {
      if (this.ctx.fileNamesForHashing.has(belong)) {
        const { fileName, exportName } = this.ctx.fileNamesForHashing.get(belong)!
        const themeName = utils.genFileBasedIdentifier({ fileName, exportName })
        return getCSSVarName(themeName, attr, this.classNamePrefix)
      }
      return belong
    }
    const [belong, attr] = spliter(s)
    if (!attr && jsAST.has(s)) {
      let css = ''
      const path = jsAST.get(s)!
      if (!isTemplateLiteral(path)) throw new Error(MESSAGES.INVALID_CSS_TOKEN)
      const { quasis } = path.node
      const expressions = path.get('expressions')
      let cap = expressions.length
      css += quasis[0].value.raw
      while (cap) {
        const { define } = handleMemeberExpression(expressions.shift()!)!
        const [belong, attr] = spliter(define)
        if (belong && attr) {
          css += getCssValue(belong, attr)
        }
        cap--
      }
      return css
    }

    return getCssValue(belong, attr)
  }

  run(rule: CSSObjectValue[] | CSSObjectValue, jsAST: Map<string, NodePath<types.Expression>>) {
    if (Array.isArray(rule)) {
      for (const r of rule) {
        this.run(r, jsAST)
      }
    } else {
      for (const selector in rule) {
        const content = rule[selector]
        // In css only `null` and `undefined` are considered as falsy values
        if (typeof content === 'undefined' || typeof content === 'object' && !content) continue
        if (typeof content === 'object') {
          this.print(selector)
          this.print('{')
          this.run(content, jsAST)
          this.print('}')
        } else {
          this.print(processStyleName(selector))
          this.print(':')
          if (typeof content === 'string') {
            let c = content
            if (MARK.isReference(c)) {
              c = this.evaluateCSSVariableFromStylex(c, jsAST)
            }
            this.print(`${c}`)
          } else {
            this.print(content)
          }
          this.print(';')
        }
      }
    }
  }
}

export function transformInjectGlobalStyle(path: NodePath<types.CallExpression>, ctx: Context) {
  const args = path.get('arguments')
  if (args.length > 1) throw new Error(MESSAGES.GLOBAL_STYLE_ONLY_ONE_ARGUMENT)
  if (!args[0].isObjectExpression()) throw new Error(MESSAGES.INVALID_CSS_AST_KIND)
  const expression = args[0]
  const result = scanObjectExpression(expression)
  if (result) {
    // eslint-disable-next-line no-unused-vars
    const [_, __1, ___2, cssRules] = result
    const sb = new Stringify(cssRules, ctx)
    const CSS = serialize(compile(sb.css), stringify)
    path.replaceWith(types.stringLiteral(''))
    return CSS
  }
}
