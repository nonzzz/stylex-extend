import { transformAsync } from '@babel/core'
import { type Plugin, ViteDevServer, searchForWorkspaceRoot } from 'vite'
import stylexExtendBabelPlugin from '@stylex-extend/babel-plugin'
import type { StylexExtendBabelPluginOptions } from '@stylex-extend/babel-plugin'

const DEFINE_CSS_EXTRA = '\0stylex-extend'

const DEFINE_CSS_EXTRA_CSS = DEFINE_CSS_EXTRA + '.css'

const VITE_INTERNAL_CSS_PLUGIN_NAMES = ['vite:css', 'vite:css-post']

export function stylexExtendPlugin(options: StylexExtendBabelPluginOptions = {}): Plugin {
  let globalStyle = ''
  const viteCSSPlugins: Plugin[] = []
  let viteServer: ViteDevServer
  return {
    name: 'stylex-extend',
    enforce: 'pre',
    buildStart() {
      globalStyle = ''
    },
    configureServer(server) {
      viteServer = server
    },
    resolveId(id) {
      if (id === DEFINE_CSS_EXTRA_CSS) return DEFINE_CSS_EXTRA_CSS
    },
    load(id) {
      if (id === DEFINE_CSS_EXTRA_CSS) {
        return globalStyle
      }
    },
    configResolved(config) {
      if (!options.unstable_moduleResolution) {
        options.unstable_moduleResolution = {
          type: 'commonJS',
          rootDir: searchForWorkspaceRoot(config.root)
        }
      }
      viteCSSPlugins.push(...config.plugins.filter(p => VITE_INTERNAL_CSS_PLUGIN_NAMES.includes(p.name)))
      viteCSSPlugins.sort((a, b) => a.name === 'vite:css' && b.name === 'vite:css-post' ? -1 : 1)
    },
    async transform(code, id) {
      if (!/\.(mjs|js|ts|vue|jsx|tsx)(\?.*|)$/.test(id) || !code.includes('@stylex-extend')) return
      const res = await transformAsync(code, { babelrc: false,
        plugins: [stylexExtendBabelPlugin.withOptions({
          ...options
        })],
        filename: id })
      if (!res) return
      if ('globalStyle' in res.metadata!) {
        globalStyle += res.metadata!.globalStyle
      }
      if (viteServer) {
        const module = viteServer.moduleGraph.getModuleById(DEFINE_CSS_EXTRA_CSS)
        if (module) {
          viteServer.moduleGraph.invalidateModule(module, new Set())
          module.lastHMRTimestamp = Date.now()
        }
      }
      return {
        code: `import ${JSON.stringify(DEFINE_CSS_EXTRA_CSS)};\n${res.code}`,
        map: res.map!
      }
    },
    async renderChunk(_, chunk) {
      const [plugin_1, plugin_2] = viteCSSPlugins

      for (const moudleId of chunk.moduleIds) {
        if (moudleId.includes(DEFINE_CSS_EXTRA_CSS)) {
          if (typeof plugin_1.transform === 'function' && typeof plugin_2.transform === 'function') {
            // @ts-expect-error
            const { code: css } = await plugin_1.transform.call(this, globalStyle, DEFINE_CSS_EXTRA_CSS)
            // @ts-expect-error
            await plugin_2.transform.call(this, css, DEFINE_CSS_EXTRA_CSS)
          }
        }
      }
    }
  }
}
