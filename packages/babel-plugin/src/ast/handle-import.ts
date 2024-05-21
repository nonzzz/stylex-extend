import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { getStringLikeKindValue, is } from './shared'
import { MESSAGES } from './message'

type ImportSpecKind = types.ImportSpecifier | types.ImportNamespaceSpecifier | types.ImportDefaultSpecifier

export const ENABLED_PKGS = {
  stylex: '@stylexjs/stylex',
  extend: '@stylex-extend/core'  
}

function onlyAcceptNamedImport(specifier: ImportSpecKind): specifier is types.ImportSpecifier {
  return specifier.type === 'ImportSpecifier'
}

function handleNamespaceAndNamedImport(specifiers: ImportSpecKind[], importSource: string, modules: Set<string>) {
  const stmts: string[] = []
  let isWhole = false
  for (const spec of specifiers) {
    is(importSource === ENABLED_PKGS.extend && onlyAcceptNamedImport(spec), MESSAGES.IMPORT_EXTEND_PKG_ERROR)
    if (importSource === ENABLED_PKGS.extend) {
      stmts.push(spec.local.name)
    }
    if (importSource === ENABLED_PKGS.stylex) {
      if (!onlyAcceptNamedImport(spec)) {
        stmts.push(spec.local.name)
        isWhole = true
        break
      }
      modules.has(getStringLikeKindValue(spec.imported)) && stmts.push(spec.local.name)
    }
  }
  return [isWhole, stmts] as const
}

export function handleImportStmt(stmts: NodePath<types.Statement>[], modules: Set<string>) {
  const state = {
    stylex: false,
    extend: false
  }
  const references: Record<'stylex' | 'extend', string[]> = {
    stylex: [],
    extend: []
  }
  let skipResolveStylex = false
  for (const stmt of stmts) {
    if (stmt.isImportDeclaration()) {
      const importSource = stmt.node.source.value
      if (importSource === ENABLED_PKGS.stylex || importSource === ENABLED_PKGS.extend) {
        if (importSource === ENABLED_PKGS.stylex) {
          if (state.stylex && skipResolveStylex) continue
          state.stylex = true
        }
        if (importSource === ENABLED_PKGS.extend) state.extend = true 
        const { specifiers } = stmt.node
        const [isWhole, specs] = handleNamespaceAndNamedImport(specifiers, importSource, modules)
        if (importSource === ENABLED_PKGS.stylex) {
          skipResolveStylex = isWhole
        }
        const key = importSource === ENABLED_PKGS.stylex ? 'stylex' : 'extend'
        references[key].push(...specs)
      }
    }
  }
  return [state, references]
}
