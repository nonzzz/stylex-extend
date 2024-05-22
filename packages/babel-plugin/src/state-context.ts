import { types } from '@babel/core'
import type { StylexBindingMeta, StylexExtendBabelPluginOptions } from './interface'

export type InternalPluginOptions = Required<Omit<StylexExtendBabelPluginOptions, 'stylex'>> & { stylex: StylexBindingMeta }

export type ImportIdentifiers = Record<string, types.Identifier>

interface FileNamesForHashing {
  fileName: string
  exportName: string
}

export class Context {
  options: InternalPluginOptions
  importIdentifiers: ImportIdentifiers
  stmts: types.VariableDeclaration[]
  anchor: number
  imports: Map<string, string>
  filename: string | undefined
  fileNamesForHashing: Map<string, FileNamesForHashing>
  constructor() {
    this.options = Object.create(null)
    this.importIdentifiers = Object.create(null)
    this.stmts = []
    this.anchor = 0
    this.imports = new Map()
    this.filename = undefined
    this.fileNamesForHashing = new Map()
  }

  setupOptions(pluginOptions: InternalPluginOptions, identifiers: ImportIdentifiers, anchor: number) {
    this.options = { ...this.options, ...pluginOptions }
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

  get themeFileExtension() {
    return this.options.unstable_moduleResolution.themeFileExtension ?? '.stylex'
  }

  addImports(i: string, o: string) {
    this.imports.set(i, o)
  }
}
