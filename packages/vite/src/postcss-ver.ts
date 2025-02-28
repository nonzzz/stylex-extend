import path from 'path'
import postcssrc from 'postcss-load-config'
import type { Plugin } from 'vite'
import type { StyleXOptions } from './index'

export interface StylexOptionsWithPostcss extends StyleXOptions {
  configFile?: string
}

export function stylex(options: StylexOptionsWithPostcss = {}): Plugin[] {
  return [
    {
      name: '@stylex-extend:postcss-resolve',
      async configResolved(config) {
        const searchPath = options.configFile ? path.dirname(options.configFile) : config.root
        const { plugins, options: postcssOptions } = await postcssrc({}, searchPath)
        console.log(plugins)
      }
    }
  ]
}
