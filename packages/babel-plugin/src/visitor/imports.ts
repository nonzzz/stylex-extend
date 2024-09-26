import { types } from '@babel/core'
import { NodePath } from '@babel/core'
import { Module } from '../module'
import { findNearestParentWithCondition, getStringLikeKindValue, isImportDeclaration, isImportSpecifier, make } from '../ast/shared'
import { Iter } from '../ast/evaluate-path'

export const FIELD = '@stylex-extend/core'
const STYLEX = '@stylexjs/stylex'

export const APIS = new Set(['inline', 'injectGlobalStyle'])

export function readImportStmt(stmts: NodePath<types.Statement>[], mod: Module) {
  for (const stmt of stmts) {
    if (isImportDeclaration(stmt)) {
      const s = getStringLikeKindValue(stmt.get('source'))
      if (s === FIELD) {
        for (const specifier of stmt.node.specifiers) {
          switch (specifier.type) {
            case 'ImportDefaultSpecifier':
            case 'ImportNamespaceSpecifier':
              mod.extendImports.set(specifier.local.name, specifier.local.name)
              break
            case 'ImportSpecifier':
              if (APIS.has(getStringLikeKindValue(specifier.imported))) {
                mod.extendImports.set(specifier.local.name, getStringLikeKindValue(specifier.imported))
              }
          }
        }
      }
    }
  }
}

export interface ImportState {
  insert: boolean
}

const state = new WeakMap<ImportState, NodePath<types.ImportDeclaration>>()
// insert relative package import stmt

function useCreatingNodePath(path: NodePath<types.ImportDeclaration>, kind: 'local' | 'imported') {
  const specifiers = path.get('specifiers') as NodePath<types.ImportSpecifier>[]
  return specifiers.map(specifier => specifier.get(kind))
}

export function insertRelativePackage(program: NodePath<types.Program>, mod: Module) {
  const { importState, importIdentifiers } = mod
  const { bindings } = program.scope
  const [create, applied] = importIdentifiers

  if (state.has(importState)) return useCreatingNodePath(state.get(importState)!, 'local')
  let importDeclaration: NodePath<types.ImportDeclaration> | null = null
  for (const { key, value } of new Iter(bindings)) {
    if (key === create || key === applied) {
      if (isImportSpecifier(value.path)) {
        const declaration = findNearestParentWithCondition(value.path, isImportDeclaration)
        if (declaration.node.source.value === STYLEX) {
          importDeclaration = declaration
        }
        break
      }
    }
  }

  if (importDeclaration) {
    const specifiers = new Set(useCreatingNodePath(importDeclaration, 'imported').map(getStringLikeKindValue))
    const diffs = importIdentifiers.filter((id) => !specifiers.has(id))
    const importSpecifiers = diffs.map((id) => make.importSpecifier(program.scope.generateUidIdentifier(id), make.identifier(id)))
    importDeclaration.pushContainer('specifiers', importSpecifiers)
    state.set(importState, importDeclaration)
  }

  if (!state.has(importState)) {
    const importSpecifiers = [
      make.importSpecifier(program.scope.generateUidIdentifier(create), make.identifier(create)),
      make.importSpecifier(program.scope.generateUidIdentifier(applied), make.identifier(applied))
    ]
    const declaration = make.importDeclaration(importSpecifiers, make.stringLiteral(STYLEX))
    const lastest = program.unshiftContainer('body', declaration)
    state.set(importState, lastest[0])
  }

  return useCreatingNodePath(state.get(importState)!, 'local')
}
