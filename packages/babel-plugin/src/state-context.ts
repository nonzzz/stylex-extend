import { types } from '@babel/core'
import type { StylexBindingMeta, StylexExtendBabelPluginOptions } from './interface'

export type InternalPluginOptions = Omit<StylexExtendBabelPluginOptions, 'stylex'> & { stylex: StylexBindingMeta }

export type ImportIdentifiers = Record<string, types.Identifier>

interface VariableMeta {
  ast: types.Identifier | types.MemberExpression | types.ObjectExpression
  reference?: types.Identifier | types.MemberExpression
}

class Effect {
  paramters: Set<string>
  references: Map<string, VariableMeta>
  constructor() {
    this.paramters = new Set()
    this.references = new Map()
  }

  clean() {
    this.paramters.clear()
    this.references.clear()
  }
}

export class Context {
  options: InternalPluginOptions
  importIdentifiers: ImportIdentifiers
  stmts: types.VariableDeclaration[]
  effect: Effect
  constructor() {
    this.options = Object.create(null)
    this.importIdentifiers = Object.create(null)
    this.stmts = []
    this.effect = new Effect()
  }

  setupOptions(pluginOptions: InternalPluginOptions, identifiers: ImportIdentifiers) {
    this.options = pluginOptions
    this.importIdentifiers = identifiers
  }

  get attach() {
    const { helper } = this.options.stylex
    if (helper in this.importIdentifiers) {
      return this.importIdentifiers[helper]
    }
    throw new Error(`[stylex-extend]: helper ${helper} is not imported`)
  }

  get enableStylex() {
    return !!this.options.stylex.helper
  }
}
