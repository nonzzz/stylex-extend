import path from 'path'
import { types } from '@babel/core'
import type { StylexBindingMeta, StylexExtendBabelPluginOptions } from './interface'

export type InternalPluginOptions = Required<Omit<StylexExtendBabelPluginOptions, 'stylex'>> & { stylex: StylexBindingMeta }

export type ImportIdentifiers = Record<string, types.Identifier>

interface FileNamesForHashing {
  fileName: string
  exportName: string
}

export function matchesFileSuffix(allowedSuffix: string) {
  return (filename: string) => filename.endsWith(`${allowedSuffix}.js`) ||
  filename.endsWith(`${allowedSuffix}.ts`) ||
  filename.endsWith(`${allowedSuffix}.tsx`) ||
  filename.endsWith(`${allowedSuffix}.jsx`) ||
  filename.endsWith(`${allowedSuffix}.mjs`) ||
  filename.endsWith(`${allowedSuffix}.cjs`) ||
  filename.endsWith(allowedSuffix)
}

const EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs']

function filePathResolver(relativePath: string, sourceFilePath: string) {
  for (const ext of ['', ...EXTENSIONS]) {
    const importPathStr = relativePath + ext
    if (importPathStr.startsWith('.')) {
      try {
        return require.resolve(importPathStr, {
          paths: [path.dirname(sourceFilePath)]
        })
      } catch {
        return null
      }
    }
  } 
}

export class Context {
  options: InternalPluginOptions
  importIdentifiers: ImportIdentifiers
  stmts: types.VariableDeclaration[]
  lastBindingPos: number
  anchor: number
  imports: Set<string>
  filename: string | undefined
  fileNamesForHashing: Map<string, FileNamesForHashing>
  constructor() {
    this.options = Object.create(null)
    this.importIdentifiers = Object.create(null)
    this.stmts = []
    this.anchor = 0
    this.imports = new Set()
    this.lastBindingPos = 0
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

  importPathResolver(importPath: string) {
    if (!this.filename) throw new Error('filename is not defined')
    const importerPath = filePathResolver(importPath, this.filename)
    if (!importerPath) throw new Error(`[stylex-extend]: Cannot resolve module ${importPath}`)
    switch (this.options.unstable_moduleResolution.type) {
      case 'commonJS':
        return [importerPath, path.relative(this.options.unstable_moduleResolution.rootDir, importerPath)]
      case 'haste':
        return [importerPath, importerPath]
      case 'experimental_crossFileParsing':
        return [importerPath, importerPath]
    }
  }

  addImports(next: string[]) {
    this.imports = new Set([...this.imports, ...next])
  }
}
