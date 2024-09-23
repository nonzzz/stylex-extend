import * as v from 'valibot'
import type { StylexExtendBabelPluginOptions } from './interface'

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
  constructor(opts = {}) {
    this.options = this.setOptions(opts)
  }

  private setOptions(opts = {} satisfies StylexExtendBabelPluginOptions) {
    return v.parse(schema, opts)
  }
}
