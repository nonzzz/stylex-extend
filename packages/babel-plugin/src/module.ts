import type { NodePath, PluginPass as BabelPluginPass, types } from '@babel/core'
import { moduleResolve } from '@dual-bundle/import-meta-resolve'
import fs from 'fs'
import path from 'path'
import url from 'url'
import * as v from 'valibot'
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

export interface PluginPass extends BabelPluginPass {
  file: Omit<BabelPluginPass['file'], 'metadata'> & {
    metadata: {
      globalStyle: string[]
    }
  }
}

export class Module {
  options: StylexExtendBabelPluginOptions
  filename: string
  extendImports: Map<string, string>
  program: NodePath<types.Program>
  importState: ImportState
  private state: PluginPass
  constructor(program: NodePath<types.Program>, opts: PluginPass) {
    this.filename = opts.filename || (opts.file.opts?.sourceFileName ?? '')
    this.options = v.parse(schema, opts.opts)
    this.extendImports = new Map()
    this.program = program
    this.state = opts
    this.state.file.metadata.globalStyle = []
    this.importState = { insert: false }
  }

  addStyle(style: string) {
    this.state.file.metadata.globalStyle.push(style)
  }

  get importIdentifiers() {
    return ['create', this.options.transport] as ['create', 'props' | 'attrs']
  }

  fileNameForHashing(relativePath: string) {
    const fileName = filePathResolver(relativePath, this.filename, this.options.aliases)
    console.log('fileNameForHashing', fileName)
    const { themeFileExtension = '.stylex', type } = this.options.unstable_moduleResolution ?? {}
    if (!fileName || !matchFileSuffix(themeFileExtension!)(fileName) || this.options.unstable_moduleResolution == null) {
      return null
    }
    switch (type) {
      case 'haste':
        return path.basename(fileName)
      default:
        return getCanonicalFilePath(fileName)
    }
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

    if (relativeFilePath[0] === '.') {
      try {
        return moduleResolve(importPathStr, url.pathToFileURL(sourceFilePath)).pathname
      } catch {
        continue
      }
    } else {
      const allAliases = possibleAliasedPaths(importPathStr, aliases)
      // Otherwise, try to resolve the path with aliases
      for (const possiblePath of allAliases) {
        try {
          return moduleResolve(possiblePath, url.pathToFileURL(sourceFilePath)).pathname
        } catch {
          continue
        }
      }
    }
  }
  // Failed to resolve the file path
  return null
}

function matchFileSuffix(allowedSuffix: string) {
  const merged = [...FILE_EXTENSIONS].map((s) => allowedSuffix + s)
  return (filename: string) => {
    for (const ext of merged) {
      if (filename.endsWith(ext)) { return true }
    }
    return filename.endsWith(allowedSuffix)
  }
}

export type PathResolverOptions = Pick<StylexExtendBabelPluginOptions, 'unstable_moduleResolution' | 'aliases'>

// Path: https://github.com/facebook/stylex/blob/main/packages/babel-plugin/src/utils/state-manager.js
// After 0.9.0 this is live

export function getCanonicalFilePath(filePath: string, rootDir?: string) {
  const pkgNameAndPath = getPackageNameAndPath(filePath)
  if (pkgNameAndPath === null) {
    if (rootDir) {
      return path.relative(rootDir, filePath)
    }
    const fileName = path.relative(path.dirname(filePath), filePath)
    return `_unknown_path_:${fileName}`
  }
  const [packageName, packageDir] = pkgNameAndPath
  return `${packageName}:${path.relative(packageDir, filePath)}`
}

export function getPackageNameAndPath(filePath: string) {
  const folder = path.dirname(filePath)
  const hasPackageJSON = fs.existsSync(path.join(folder, 'package.json'))
  if (hasPackageJSON) {
    try {
      const json = JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8')) as { name: string }
      return [json.name, folder]
    } catch (error) {
      console.error(error)
      return null
    }
  }
  if (folder === path.parse(folder).root || folder === '') {
    return null
  }
  return getPackageNameAndPath(folder)
}

export function addFileExtension(importedFilePath: string, sourceFile: string) {
  if (FILE_EXTENSIONS.some((ext) => importedFilePath.endsWith(ext))) {
    return importedFilePath
  }
  const fileExtension = path.extname(sourceFile)
  // NOTE: This is unsafe. We are assuming the all files in your project
  // use the same file extension.
  // However, in a haste module system we have no way to resolve the
  // *actual* file to get the actual file extension used.
  return importedFilePath + fileExtension
}
