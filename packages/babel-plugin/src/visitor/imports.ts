/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @eslint-react/hooks-extra/no-useless-custom-hooks */
import { types } from '@babel/core'
import { NodePath } from '@babel/core'
import { Iter } from '../ast/evaluate-path'
import { findNearestParentWithCondition, getStringLikeKindValue, isImportDeclaration, isImportSpecifier, make } from '../ast/shared'
import { Module } from '../module'

export const FIELD = '@stylex-extend/core'
const STYLEX = '@stylexjs/stylex'

export const APIS = new Set(['inline', 'injectGlobalStyle', 'id'])

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

function useCreatingNodePath<K extends 'local' | 'imported'>(
  path: NodePath<types.ImportDeclaration>,
  kind: K,
  importIdentifiers: string[]
): K extends 'local' ? NodePath<types.Identifier>[] : NodePath<types.StringLiteral>[] {
  const x = new Set(importIdentifiers)
  const tpl: NodePath<types.Identifier | types.StringLiteral>[] = []
  for (const specifier of path.get('specifiers') as NodePath<types.ImportSpecifier>[]) {
    const s = specifier.get(kind)
    if (x.has(getStringLikeKindValue(specifier.get('imported')))) {
      // @ts-expect-error safe
      tpl.push(s)
    }
  }
  return tpl.sort((a) => {
    const aName = getStringLikeKindValue(a)
    if (aName === 'create') { return -1 }
    return 0
  }) as K extends 'local' ? NodePath<types.Identifier>[] : NodePath<types.StringLiteral>[]
}

export function insertRelativePackage(program: NodePath<types.Program>, mod: Module) {
  const { importState, importIdentifiers } = mod
  const { bindings } = program.scope
  const [create, applied] = importIdentifiers

  if (state.has(importState)) { return useCreatingNodePath(state.get(importState)!, 'local', importIdentifiers) }
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
    const specifiers = new Set(useCreatingNodePath(importDeclaration, 'imported', importIdentifiers).map(getStringLikeKindValue))
    const diffs = importIdentifiers.filter((id) => !specifiers.has(id))
    const importSpecifiers = diffs.map((id) => make.importSpecifier(program.scope.generateUidIdentifier(id), make.identifier(id)))
    importDeclaration.unshiftContainer('specifiers', importSpecifiers)
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

  return useCreatingNodePath(state.get(importState)!, 'local', importIdentifiers)
}
