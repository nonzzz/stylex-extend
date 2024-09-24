import path from 'path'
import * as v from 'valibot'
import type { NodePath, PluginPass, types } from '@babel/core'
import type { StylexExtendBabelPluginOptions } from './interface'
import { ImportState } from './visitor/imports'

const unstable_moduleResolution = {
  CommonJs: 'commonJS',
  Haste: 'haste',
  ExperimentalCrossFileParsing: 'experimental_crossFileParsing'
} as const

const schema = v.object({
  transport: v.optional(v.string(), 'props'),
  aliases: v.optional(v.record(v.string(), v.union([v.string(), v.array(v.string())])), {}),
  importSources: v.optional(v.array(v.string()), ['@stylexjs/stylex']),
  classNamePrefix: v.optional(v.string(), 'x'),
  unstable_moduleResolution: v.optional(
    v.object({
      type: v.enum(unstable_moduleResolution),
      rootDir: v.string(),
      themeFileExtension: v.optional(v.string(), '.stylex')
    }),
    {
      type: 'commonJS',
      rootDir: process.cwd(),
      themeFileExtension: '.stylex'
    }
  )
})

export class Module {
  options: StylexExtendBabelPluginOptions
  filename: string
  extendImports: Map<string, string>
  program: NodePath<types.Program>
  importState: ImportState
  constructor(program: NodePath<types.Program>, opts: PluginPass) {
    this.filename = opts.filename || (opts.file.opts?.sourceFileName ?? '')
    this.options = this.setOptions(opts.opts)
    this.extendImports = new Map()
    this.program = program
    this.importState = { insert: false }
  }

  private setOptions(opts = {} satisfies StylexExtendBabelPluginOptions) {
    return v.parse(schema, opts)
  }

  get importIdentifiers() {
    return ['create', this.options.transport] as ['create', 'props' | 'attrs']
  }

  // Respect the official importSources
  get importSources() {
    return ['@stylexjs/stylex', 'stylex', ...this.options.importSources!]
  }
}

const FILE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs']

function possibleAliasedPaths(
  importPath: string,
  aliases: StylexExtendBabelPluginOptions['aliases']
): string[] {
  const result = [importPath]
  if (aliases == null || Object.keys(aliases).length === 0) {
    return result
  }
  for (const [alias, _value] of Object.entries(aliases)) {
    const value = Array.isArray(_value) ? _value : [_value]
    if (alias.includes('*')) {
      const [before, after] = alias.split('*')
      if (importPath.startsWith(before) && importPath.endsWith(after)) {
        const replacementString = importPath.slice(
          before.length,
          after.length > 0 ? -after.length : undefined
        )
        value.forEach((v) => {
          result.push(v.split('*').join(replacementString))
        })
      }
    } else if (alias === importPath) {
      value.forEach((v) => {
        result.push(v)
      })
    }
  }

  return result
}

function filePathResolver(relativeFilePath: string, sourceFilePath: string, aliases: StylexExtendBabelPluginOptions['aliases']) {
  for (const ext of ['', ...FILE_EXTENSIONS]) {
    const importPathStr = relativeFilePath + ext

    // Try to resolve relative paths as is
    if (importPathStr.startsWith('.')) {
      try {
        return require.resolve(importPathStr, {
          paths: [path.dirname(sourceFilePath)]
        })
      } catch {}
    }

    // Otherwise, try to resolve the path with aliases
    const allAliases = possibleAliasedPaths(importPathStr, aliases)
    for (const possiblePath of allAliases) {
      try {
        return require.resolve(possiblePath, {
          paths: [path.dirname(sourceFilePath)]
        })
      } catch {}
    }
  }
  // Failed to resolve the file path
  return null 
}

function matchFileSuffix(allowedSuffix: string) {
  const merged = [...FILE_EXTENSIONS].map(s => allowedSuffix + s)
  return (filename: string) => {
    for (const ext of merged) {
      if (filename.endsWith(ext)) return true
    }
    return filename.endsWith(allowedSuffix)
  }
}

export type PathResolverOptions = Pick<StylexExtendBabelPluginOptions, 'unstable_moduleResolution' | 'importSources' | 'aliases'>

export function importPathResolver(importPath: string, filename: string, options: PathResolverOptions) {
  if (!filename) return null
  switch (options.unstable_moduleResolution?.type) {
    case 'commonJS': {
      const { rootDir, themeFileExtension = '.stylex' } = options.unstable_moduleResolution
      const { aliases } = options
      if (!matchFileSuffix(themeFileExtension!)(importPath)) return false
      const resolvedFilePath = filePathResolver(importPath, filename, aliases)
      return resolvedFilePath ? ['Ref', path.relative(rootDir, resolvedFilePath)] : false
    }
    case 'haste': {
      const { themeFileExtension = '.stylex' } = options.unstable_moduleResolution
      const { aliases } = options
      if (!matchFileSuffix(themeFileExtension!)(importPath)) return false
      const resolvedFilePath = filePathResolver(
        importPath,
        filename,
        aliases
      )
      return resolvedFilePath ? ['hasteRef', resolvedFilePath] : false
    }  
    case 'experimental_crossFileParsing':
      // TODO
      return false
    default:
      return false
  }
}
