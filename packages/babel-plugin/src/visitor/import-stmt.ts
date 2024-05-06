import fs from 'fs'
import { parseSync, traverse } from '@babel/core'
import { types } from '@babel/core'
import type { NodePath } from '@babel/core'
import { Context, matchesFileSuffix } from '../state-context'
import { getStringValue } from './jsx-attribute'

export const STYLEX_EXTEND = '@stylex-extend/core'

function isTopLevelCalled(p: NodePath) {
  return types.isProgram(p.parent) || types.isExportDefaultDeclaration(p.parent) || types.isExportNamedDeclaration(p.parent)
}

export function scanImportStmt(stmts: NodePath<types.Statement>[], ctx: Context) {
  const matchers = matchesFileSuffix(ctx.options.unstable_moduleResolution.themeFileExtension ?? '.stylex')
  for (const stmt of stmts) {
    if (!stmt.isImportDeclaration()) continue
    if (stmt.node.source.value === STYLEX_EXTEND || matchers(stmt.node.source.value)) {
      const specs = stmt.node.specifiers.filter((s) => s.type === 'ImportSpecifier') as types.ImportSpecifier[] 
      if (stmt.node.source.value === STYLEX_EXTEND) {
        ctx.addImports(specs.map((s) => [s.local.name, STYLEX_EXTEND]))
      } else {
        if (!ctx.options.enableInjectGlobalStyle) continue
        const [filePath, fileName] = ctx.importPathResolver(stmt.node.source.value)
        const codeContent = fs.readFileSync(filePath, 'utf-8')
        const ast = parseSync(codeContent, { babelrc: true, parserOpts: { plugins: ['jsx', 'typescript'] } })
        const seens = new Set<string>(specs.map((s) => getStringValue(s.imported)))
        traverse(ast!, {
          VariableDeclaration(path) {
            if (isTopLevelCalled(path)) {
              const { node } = path
              for (const decl of node.declarations) {
                if (types.isIdentifier(decl.id) && seens.has(decl.id.name)) {
                  const varId = decl.id.name
                  ctx.fileNamesForHashing.set(decl.id.name, { fileName, exportName: varId })
                }
              }
            }
            path.skip()
          }
        })
      }
    }
  }
}
