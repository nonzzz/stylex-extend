import { types } from '@babel/core'
import type { StylexBindingMeta, StylexExtendBabelPluginOptions } from './interface'

export type InternalPluginOptions = Required<Omit<StylexExtendBabelPluginOptions, 'stylex'>> & { stylex: StylexBindingMeta }

export type ImportIdentifiers = Record<string, types.Identifier>

export class Context {
  options: InternalPluginOptions
  importIdentifiers: ImportIdentifiers
  stmts: types.VariableDeclaration[]
  lastBindingPos: number
  anchor: number
  imports: Set<string>
  filename: string | undefined
  constructor() {
    this.options = Object.create(null)
    this.importIdentifiers = Object.create(null)
    this.stmts = []
    this.anchor = 0
    this.imports = new Set()
    this.lastBindingPos = 0
    this.filename = undefined
  }

  setupOptions(pluginOptions: InternalPluginOptions, identifiers: ImportIdentifiers, anchor: number) {
    this.options = pluginOptions
    this.importIdentifiers = identifiers
    this.anchor = anchor
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

  get fileNamesForHashing() {
    return []
  }

  importPathResolver(importPath: string) {
    
  }
}
