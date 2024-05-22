import { types } from '@babel/core'
import type { NodePath } from '@babel/core'

export const ENABLED_PKGS = {
  stylex: '@stylexjs/stylex',
  extend: '@stylex-extend/core'  
}

export function handleImportStmt(stmts: NodePath<types.Statement>[], callback: (path: NodePath<types.ImportDeclaration>) => void | boolean) {
  for (const stmt of stmts) {
    if (stmt.isImportDeclaration()) {
      const stop = callback(stmt as NodePath<types.ImportDeclaration>)
      if (stop) break
    }
  }
}
