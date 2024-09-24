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
}
