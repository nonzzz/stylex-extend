import { types } from '@babel/core'
import { utils } from '@stylexjs/shared'
import type { NodePath } from '@babel/core'
import { compile, serialize, stringify } from 'stylis'
import { Context } from '../state-context'
import type { CSSObjectValue } from '../interface'
import { MARK, scanObjectExpression } from '../ast/evaluate-css'
import { MESSAGES } from '../ast/message'
import { STYLEX_EXTEND } from './import-stmt'

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
  constructor(rules: CSSObjectValue[], ctx: Context) {
    this.css = ''
    this.ctx = ctx
    this.run(rules)
  }

  print(s: string | number) {
    this.css += s
  }

  get classNamePrefix() {
    return this.ctx.options.classNamePrefix
  }

  run(rule: CSSObjectValue[] | CSSObjectValue) {
    if (Array.isArray(rule)) {
      for (const r of rule) {
        this.run(r)
      }
    } else {
      for (const selector in rule) {
        const content = rule[selector]
        // In css only `null` and `undefined` are considered as falsy values
        if (typeof content === 'undefined' || typeof content === 'object' && !content) continue
        if (typeof content === 'object') {
          this.print(selector)
          this.print('{')
          this.run(content)
          this.print('}')
        } else {
          this.print(processStyleName(selector))
          this.print(':')
          if (typeof content === 'string') {
            let c = content
            if (MARK.isReference(c)) {
              const [belong, attr] = kebabCase(content.slice(2)).split('-')
              if (this.ctx.fileNamesForHashing.has(belong)) {
                const { fileName, exportName } = this.ctx.fileNamesForHashing.get(belong)!
                const themeName = utils.genFileBasedIdentifier({ fileName, exportName })
                c = getCSSVarName(themeName, attr, this.classNamePrefix)
              }
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
  const { node } = path
  if (!node || node.callee.type !== 'Identifier' || !ctx.imports.has(node.callee.name)) return
  if (ctx.imports.get(node.callee.name) !== STYLEX_EXTEND || node.callee.name !== 'injectGlobalStyle') return
  const args = path.get('arguments')
  if (args.length > 1) throw new Error(MESSAGES.GLOBAL_STYLE_ONLY_ONE_ARGUMENT)
  if (!args[0].isObjectExpression()) throw new Error(MESSAGES.INVALID_CSS_AST_KIND)
  const expression = args[0]
  const result = scanObjectExpression(expression)
  if (result) {
    // eslint-disable-next-line no-unused-vars
    const [_, __1, ___2, cssRules] = result
    const sb = new Stringify(cssRules.map(r => r.rule), ctx)
    const CSS = serialize(compile(sb.css), stringify)
    path.replaceWith(types.stringLiteral(''))
    return CSS
  }
}
