import { transformAsync } from '@babel/core'
import { type Plugin, searchForWorkspaceRoot } from 'vite'
import stylexExtendBabelPlugin from '@stylex-extend/babel-plugin'
import type { StylexExtendBabelPluginOptions } from '@stylex-extend/babel-plugin'

export function stylexExtendPlugin(options: StylexExtendBabelPluginOptions = {}): Plugin {
  let globalStyle = ''
  return {
    name: 'stylex-extend',
    enforce: 'pre',
    buildStart() {
      globalStyle = ''
    },
    configResolved(config) {
      if (!options.unstable_moduleResolution) {
        options.unstable_moduleResolution = {
          type: 'commonJS',
          rootDir: searchForWorkspaceRoot(config.root)
        }
      }
    },
    async transform(code, id) {
      if (!/\.(mjs|js|ts|vue|jsx|tsx)(\?.*|)$/.test(id)) return
      const res = await transformAsync(code, { babelrc: false,
        plugins: [stylexExtendBabelPlugin.withOptions({
          ...options
        })],
        filename: id })
      if (!res) return
      if ('globalStyle' in res.metadata!) {
        globalStyle += res.metadata!.globalStyle
      }
      console.log(globalStyle)
      return {
        code: res.code!,
        map: res.map!
      }
    }
  }
}
