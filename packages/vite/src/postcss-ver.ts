/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TransformOptions } from '@babel/core'
import { createFilter } from '@rollup/pluginutils'
import type { StylexExtendBabelPluginOptions } from '@stylex-extend/babel-plugin'
import fs from 'fs'
import type { CSSOptions, ModuleNode, Plugin, Update, ViteDevServer } from 'vite'
import { searchForWorkspaceRoot } from 'vite'
import { ensureParserOpts, getPlugin, interopDefault, isPotentialCSSFile, transformStyleX } from './compile'
import { CONSTANTS, WELL_KNOW_LIBS, defaultOptions, unique } from './index'
import type { RollupPluginContext, StyleXOptions } from './index'

// Note that postcss ver has limitations and can't handle non-js syntax. Like .vue .svelte and etc.

type PostCSSAcceptedPlugin = Exclude<Exclude<CSSOptions['postcss'], undefined | string>['plugins'], undefined>[number]

interface StylexPostCSSPluginOptions {
  cwd?: string
  babelConfig?: TransformOptions
  include?: string[]
  exclude?: string[]
  useCSSLayer: boolean
}

export interface StylexOptionsWithPostcss extends StyleXOptions {
  postcss?: {
    include: StylexPostCSSPluginOptions['include'],
    exclude: StylexPostCSSPluginOptions['exclude'],
    aliases: StylexExtendBabelPluginOptions['aliases']
  }
}

function getExtensionPriority(file: string) {
  if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(file)) { return 0 }
  if (/\.css$/.test(file)) { return 1 }
  return 2
}

export function stylex(options: StylexOptionsWithPostcss = {}): Plugin[] {
  const cssPlugins: Plugin[] = []
  options = { ...defaultOptions, ...options }
  const { macroTransport, useCSSLayer = false, optimizedDeps: _, include, postcss: postcssConfig, exclude, babelConfig, ...rest } = options
  const filter = createFilter(include, exclude)
  const accepts: Set<string> = new Set()
  const effects: Map<string, boolean> = new Map()
  let globalCSS: Record<string, string[]> = {}
  const servers: ViteDevServer[] = []

  const produceCSS = () => {
    return Object.values(globalCSS).join('\n')
  }

  return [
    {
      name: '@stylex-extend:postcss-resolve',
      enforce: 'pre',
      buildStart() {
        if (!this.meta.watchMode) {
          effects.clear()
          accepts.clear()
          globalCSS = {}
        }
      },
      async config(config) {
        if (!config.css) {
          config.css = {}
        }
        if (config.css.transformer === 'lightningcss') {
          throw new Error('Lightningcss is not supported by stylex-extend')
        }
        if (typeof config.css.postcss === 'string') {
          throw new Error('Postcss config file is not supported by stylex-extend')
        }
        // config.css.postcss.
        if (!config.css.postcss) {
          config.css.postcss = {
            plugins: []
          }
        }

        const rootDir = searchForWorkspaceRoot(config.root || process.cwd())
        if (!options.unstable_moduleResolution) {
          // For monorepo.
          options.unstable_moduleResolution = { type: 'commonJS', rootDir }
        }

        // @ts-expect-error ignored
        const postcss = await import('@stylexjs/postcss-plugin').then((m: unknown) => interopDefault(m)) as (
          opts: StylexPostCSSPluginOptions
        ) => PostCSSAcceptedPlugin

        const extend = await getPlugin('extend')
        const standard = await getPlugin('standard')

        const instance = postcss({
          include: postcssConfig?.include || [],
          exclude: postcssConfig?.exclude || [],
          useCSSLayer,
          cwd: rootDir,
          babelConfig: {
            parserOpts: {
              plugins: ['jsx', 'typescript']
            },
            plugins: [
              extend.withOptions({
                // @ts-expect-error safe
                unstable_moduleResolution: options.unstable_moduleResolution,
                // @ts-expect-error safe
                transport: macroTransport,
                classNamePrefix: options.classNamePrefix,
                aliases: postcssConfig?.aliases
              }),
              standard.withOptions({
                // @ts-expect-error safe
                unstable_moduleResolution: options.unstable_moduleResolution,
                runtimeInjection: false,
                classNamePrefix: options.classNamePrefix,
                aliases: postcssConfig?.aliases
              })
            ]
          }
        })
        config.css.postcss.plugins?.unshift(instance)
      },
      configResolved(config) {
        for (const plugin of config.plugins) {
          if (plugin.name === 'vite:css' || plugin.name === 'vite:css-post') {
            cssPlugins.push(plugin)
          }
        }
        cssPlugins.sort((a, b) => a.name.length - b.name.length)
        const optimizedDeps = unique([
          ...Array.isArray(options.optimizedDeps) ? options.optimizedDeps : [],
          ...Array.isArray(options.importSources) ? options.importSources.map((s) => typeof s === 'string' ? s : s.from) : [],
          ...WELL_KNOW_LIBS
        ])
        if (config.command === 'serve') {
          config.optimizeDeps.exclude = [...optimizedDeps, ...(config.optimizeDeps.exclude || [])]
        }
        if (config.appType === 'custom') {
          config.ssr.noExternal = Array.isArray(config.ssr.noExternal)
            ? [...config.ssr.noExternal, ...optimizedDeps]
            : config.ssr.noExternal
        }
      },
      transform(code, id) {
        if (isPotentialCSSFile(id) && !id.includes('node_modules')) {
          if (code.includes(CONSTANTS.REFERENCE_KEY)) {
            accepts.add(id)
          }
        }
      },
      configureServer(server) {
        servers.push(server)
      }
    },
    {
      name: '@stylex-extend:pre-convert',
      enforce: 'pre',
      transform: {
        order: 'pre',
        async handler(code, id) {
          if (macroTransport === false || id.includes('node_modules')) {
            return
          }
          if (!/\.[jt]sx?$/.test(id) || id.startsWith('\0')) {
            return
          }

          if (id in globalCSS) {
            delete globalCSS[id]
          }
          const plugins = ensureParserOpts(id)
          if (!plugins) { return }
          const res = await transformStyleX('extend', {
            code,
            filename: id,
            options: {
              transport: macroTransport,
              classNamePrefix: options.classNamePrefix,
              //  @ts-expect-error safe
              unstable_moduleResolution: options.unstable_moduleResolution,
              aliases: postcssConfig?.aliases
            },
            parserOpts: { plugins }
          }, babelConfig)
          if (res && res.code) {
            if (res.metadata && CONSTANTS.STYLEX_EXTEND_META_KEY in res.metadata) {
              // @ts-expect-error safe
              globalCSS[id] = res.metadata[CONSTANTS.STYLEX_EXTEND_META_KEY] as string[]
              if (globalCSS[id].length) {
                accepts.add(id)
              }
            }
            return { code: res.code, map: res.map }
          }
        }
      }
    },
    {
      name: '@stylex-extend:post-convert',
      enforce: 'post',
      async transform(code, id) {
        if (id.includes('/node_modules/')) { return }
        if (!filter(id) || isPotentialCSSFile(id) || id.startsWith('\0')) {
          return
        }
        const res = await transformStyleX('standard', {
          code,
          filename: id,
          options: {
            ...rest,
            unstable_moduleResolution: options.unstable_moduleResolution,
            runtimeInjection: false,
            importSources: options.importSources,
            aliases: postcssConfig?.aliases
          }
        }, babelConfig)
        if (res && res.code) {
          if (res.metadata && CONSTANTS.STYLEX_META_KEY in res.metadata) {
            effects.set(id, true)
          }

          return { code: res.code, map: res.map }
        }
      }
    },
    {
      name: '@stylex-extend:flush-css',
      enforce: 'post',
      transform(code, id) {
        if (accepts.has(id) && servers.length > 0 && isPotentialCSSFile(id)) {
          // hard code replace const __vite__css__ = `...` to const __vite__css__ = ``
          const CSS_REGEX = /const\s+__vite__css\s*=\s*"([^"\\]*(?:\\.[^"\\]*)*)"/
          code = code.replace(CSS_REGEX, (_, s: string) => {
            return `const __vite__css = \`${s + produceCSS()}\``
          })
          return {
            code,
            map: { mappings: '' }
          }
        }
      },
      handleHotUpdate(ctx) {
        const { file, modules, server } = ctx
        if (effects.has(file)) {
          const cssModules = [...accepts].map((id) => server.moduleGraph.getModuleById(id)).filter(Boolean) as ModuleNode[]
          cssModules.sort((a, b) => {
            const priorityA = getExtensionPriority(a.file || '')
            const priorityB = getExtensionPriority(b.file || '')
            return priorityA - priorityB
          })
          if (cssModules.length) {
            cssModules.forEach((mod) => {
              server.moduleGraph.invalidateModule(mod)
              if (!server.moduleGraph.getModuleById(mod.id!)) {
                accepts.delete(mod.id!)
              }
            })

            const updates: Update[] = cssModules.map((mod) => ({
              type: 'js-update',
              path: mod.url,
              acceptedPath: mod.url,
              timestamp: Date.now()
            }))
            server.ws.send({
              type: 'update',
              updates
            })
            return [...modules, ...cssModules]
          }
        }
      }
    },
    {
      name: '@stylex-extend/vite:build-css',
      apply: 'build',
      enforce: 'pre',
      async renderStart() {
        const cssModules = [...accepts].filter((a) => isPotentialCSSFile(a))
        const chunks = cssModules.map((file) => {
          return { css: fs.readFileSync(file, 'utf8') + '\n' + produceCSS(), id: file }
        })
        for (const c of chunks) {
          let css = c.css
          for (const plugin of cssPlugins) {
            if (!plugin.transform) { continue }
            const transformHook = typeof plugin.transform === 'function' ? plugin.transform : plugin.transform.handler
            const ctx = {
              ...this,
              getCombinedSourcemap: () => {
                throw new Error('getCombinedSourcemap not implemented')
              }
            } satisfies RollupPluginContext
            const res = await transformHook.call(ctx, css, c.id)
            if (!res) { continue }
            if (typeof res === 'string') {
              css = res
            }
            if (typeof res === 'object' && res.code) {
              css = res.code
            }
          }
        }
      }
    }
  ]
}
