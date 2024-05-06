import { types } from '@babel/core'
import { utils } from '@stylexjs/shared'
import type { NodePath } from '@babel/core'
import { compile, serialize, stringify } from 'stylis'
import { Context } from '../state-context'
import type { CSSObjectValue } from '../interface'
import { createCSSContext, scanObjectExpression } from './jsx-attribute'

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
            if (content[0] === '_' && content[1] === '~') {
              const [belong, attr] = content.slice(2).split('.')
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
  const args = path.get('arguments')
  if (args.length > 1) throw new Error(`[stylex-extend]: ${node.callee.name} only accept one argument`)
  if (!args[0].isObjectExpression()) throw new Error('[stylex-extend]: can\'t pass not object value for attribute \'stylex\'.')
  const expression = args[0]
  const CSSContext = createCSSContext(expression.node.properties.length, ctx.anchor)
  scanObjectExpression(expression, CSSContext)
  const sb = new Stringify(CSSContext.rules, ctx)
  const CSS = serialize(compile(sb.css), stringify)
  path.replaceWith(types.stringLiteral(''))
  return CSS
}
