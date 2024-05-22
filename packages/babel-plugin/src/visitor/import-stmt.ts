import path from 'path'
import { createRequire } from 'module'
import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { Context } from '../state-context'
import { getStringLikeKindValue } from '../ast/shared'
import { MESSAGES } from '../ast/message'
import { ENABLED_PKGS, handleImportStmt } from '../ast/handle-import'
import type { StylexExtendBabelPluginOptions } from '../interface'

export const EXTEND_INJECT_GLOBAL_STYLE = 'injectGlobalStyle'

export const EXTEND_INLINE = 'inline'

const _require = createRequire(__filename)

// the order is same as stylexjs
const FILE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs']

// Define a function to record css variable file
function createCSSVariableMatchers(extendSuffix = '', ...suffixs: string[]) {
  const merged = [...FILE_EXTENSIONS, ...suffixs].map(s => s !== extendSuffix ? extendSuffix + s : s)
  return (filename: string) => {
    for (const ext of merged) {
      if (filename.endsWith(ext)) return true
    }
  }
}

type Aliases = StylexExtendBabelPluginOptions['aliases']

function resolvePathAliases(path: string, aliases: Aliases) {
  const result = [path]
  if (aliases == null || Object.keys(aliases).length === 0) {
    return result
  }
  for (const [alias, _value] of Object.entries(aliases)) {
    const value = Array.isArray(_value) ? _value : [_value]
    if (alias.includes('*')) {
      const [before, after] = alias.split('*')
      if (path.startsWith(before) && path.endsWith(after)) {
        const replacementString = path.slice(
          before.length,
          after.length > 0 ? -after.length : undefined
        )
        value.forEach((v) => {
          result.push(v.split('*').join(replacementString))
        })
      }
    } else if (alias === path) {
      value.forEach((v) => {
        result.push(v)
      })
    }
  }

  return result
}

function resolveRelativePath(relativePath: string, ctx: Context) {
  if (!ctx.filename) throw new Error(MESSAGES.INVALID_FILE)
  let filePath = ''
  for (const ext of ['', ...FILE_EXTENSIONS]) {
    const relativePathWithExtension = relativePath + ext
    if (relativePathWithExtension.startsWith('.')) {
      try {
        filePath = _require.resolve(relativePathWithExtension, {
          paths: [path.dirname(ctx.filename)]
        })
        break
      } catch {
        continue
      }
    }
    const aliases = resolvePathAliases(relativePathWithExtension, ctx.options.aliases)
    for (const possiblePath of aliases) {
      try {
        filePath = require.resolve(possiblePath, {
          paths: [path.dirname(ctx.filename)]
        })
        break
      } catch {}
    }
  } 
  if (!filePath) throw new Error(MESSAGES.INVALID_FILE)

  switch (ctx.options.unstable_moduleResolution.type) {
    case 'commonJS':
      return [filePath, path.resolve(ctx.options.unstable_moduleResolution.rootDir, filePath)]
    case 'haste':
    case 'experimental_crossFileParsing':
      return [filePath, filePath]
  }
}

export function scanImportStmt(stmts: NodePath<types.Statement>[], ctx: Context) {
  const matchers = createCSSVariableMatchers(ctx.themeFileExtension, ctx.themeFileExtension)
  const relativeCSSPaths = new Map<string, string[]>()
  handleImportStmt(stmts, (path) => {
    const importSource = getStringLikeKindValue(path.get('source'))
    if (matchers(importSource)) {
      if (!relativeCSSPaths.has(importSource)) {
        relativeCSSPaths.set(importSource, [])
      }
      for (const spec of path.node.specifiers) {
        // TODO: handle other import types
        if (types.isImportSpecifier(spec)) {
          // using imported can sync the hash with stylexjs
          relativeCSSPaths.get(importSource)!.push(getStringLikeKindValue(spec.imported))
        }
      }
    }
    if (importSource === ENABLED_PKGS.extend) {
      for (const spec of path.node.specifiers) {
        // TODO: handle other import types
        if (types.isImportSpecifier(spec)) {
          ctx.addImports(getStringLikeKindValue(spec.local), getStringLikeKindValue(spec.imported))
        }
      }
    }
  })

  relativeCSSPaths.forEach((specs, importSource) => {
    // eslint-disable-next-line no-unused-vars
    const [_, fileName] = resolveRelativePath(importSource, ctx)
    for (const spec of specs) {
      ctx.fileNamesForHashing.set(spec, { fileName, exportName: spec })
    }
  })
}
