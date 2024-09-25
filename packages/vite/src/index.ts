/* eslint-disable no-use-before-define */
import path from 'path'
import type { HookHandler, Plugin, Update, ViteDevServer } from 'vite'
import { parseSync, transformAsync } from '@babel/core'
import type { Options, Rule } from '@stylexjs/babel-plugin'
import { createFilter } from '@rollup/pluginutils'
import type { FilterPattern } from '@rollup/pluginutils'
import stylexBabelPlugin from '@stylexjs/babel-plugin'
import extendBabelPlugin, { StylexExtendBabelPluginOptions } from '@stylex-extend/babel-plugin'
import { normalizePath, searchForWorkspaceRoot } from 'vite'
import type { ParserOptions, PluginItem } from '@babel/core'

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never

type Push<T extends any[], V> = [...T, V]

type UnionDeepMutable<T extends any[]> = T extends [infer L, ...infer R] ? L extends object ? [DeepMutable<L>, ...UnionDeepMutable<R>]
  : [L, ...UnionDeepMutable<R>]
  : []

type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>
type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]>
    : TuplifyUnion<T[P]>['length'] extends 1 ? T[P]
    // eslint-disable-next-line stylistic/indent
    : UnionDeepMutable<TuplifyUnion<T[P]>>[number]
}

type InternalOptions = DeepMutable<Omit<Options, 'dev' | 'runtimeInjection' | 'aliases'>>

export interface StyleXOptions extends Partial<InternalOptions> {
  include?: FilterPattern
  exclude?: FilterPattern
  /**
   * @description For some reasons, vite can't handle cjs module resolution correctly. so pass this option to fix it.
   */
  optimizedDeps?: Array<string>
  useCSSLayer?: boolean
  babelConfig?: {
    plugins?: Array<PluginItem>
    presets?: Array<PluginItem>
  }
  /**
   * @default true
   * @description https://nonzzz.github.io/stylex-extend/
   */
  macroTransport?: StylexExtendBabelPluginOptions['transport'] | false
  [key: string]: any
}

type TransformWithStyleXType = 'extend' | 'standard'

interface TransformWithStyleXRestOptions<T = TransformWithStyleXType> {
  code: string
  filename: string
  options: T extends 'extend' ? Parameters<typeof extendBabelPlugin.withOptions>[0]
    : Parameters<typeof stylexBabelPlugin.withOptions>[0]
  parserOpts?: any
}

interface ImportSpecifier {
  n: string | undefined
  s: number
  e: number
}

type BabelParserPlugins = ParserOptions['plugins']

interface HMRPayload {
  hash: string
}

function noop() {}

function interopDefault(m: any) {
  return m.default || m
}

const transform: HookHandler<Plugin['transform']> = noop
type RollupPluginContext = ThisParameterType<typeof transform>

const CONSTANTS = {
  REFERENCE_KEY: '@stylex;',
  STYLEX_META_KEY: 'stylex',
  STYLEX_EXTEND_META_KEY: 'globalStyle',
  VIRTUAL_STYLEX_MARK: 'virtual:stylex.css'
}

const WS_EVENT_TYPE = 'stylex:hmr'

const defaultOptions = {
  include: /\.(mjs|js|ts|vue|jsx|tsx)(\?.*|)$/,
  importSources: ['stylex', '@stylexjs/stylex'],
  macroTransport: 'props',
  useCSSLayer: false
} satisfies StyleXOptions

const WELL_KNOW_LIBS = ['@stylexjs/open-props']

function unique<T>(data: T[]) {
  return Array.from(new Set(data))
}

function getExt(p: string) {
  const [filename] = p.split('?', 2)
  return path.extname(filename).slice(1)
}

function isPotentialCSSFile(id: string) {
  const extension = getExt(id)
  return extension === 'css' || (extension === 'vue' && id.includes('&lang.css')) || (extension === 'astro' && id.includes('&lang.css'))
}

class EffectModule {
  id: string
  meta: Rule[]
  constructor(id: string, meta: any) {
    this.id = id
    this.meta = meta
  }
}

// Vite's plugin can't handle all senarios, so we have to implement a cli to handle the rest.

export function stylex(options: StyleXOptions = {}): Plugin[] {
  const cssPlugins: Plugin[] = []
  options = { ...defaultOptions, ...options }
  const { macroTransport, useCSSLayer, optimizedDeps: _, include, exclude, babelConfig, ...rest } = options
  let isBuild = false
  const servers: ViteDevServer[] = []

  const roots = new Map<string, EffectModule>()
  let globalCSS = {}
  let lastHash = ''

  const filter = createFilter(include, exclude)

  const produceCSS = () => {
    return stylexBabelPlugin.processStylexRules(
      [...roots.values()]
        .map(r => r.meta).flat().filter(Boolean),
      useCSSLayer!
    ) + '\n' + Object.values(globalCSS).join('\n')
  }

  const xxhash = (str: string) => {
    let i
    let l
    let hval = 0x811C9DC5

    for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i)
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
    }
    return (`00000${(hval >>> 0).toString(36)}`).slice(-6)
  }

  // rollup private parse and es-module lexer can't parse JSX. So we have had to use babel to parse the import statements.
  const parseStmts = (code: string, id: string, plugins: BabelParserPlugins = []) => {
    const ast = parseSync(code, { filename: id, babelrc: false, parserOpts: { plugins } })
    const stmts: ImportSpecifier[] = []
    for (const n of ast!.program.body) {
      if (n.type === 'ImportDeclaration') {
        const v = n.source.value
        if (!v) continue
        const { start: s, end: e } = n.source
        if (typeof s === 'number' && typeof e === 'number') {
          stmts.push({ n: v, s: s + 1, e: e - 1 })
        }
      }
    }
    return stmts
  }

  const rewriteImportStmts = async (code: string, id: string, ctx: RollupPluginContext, plugins: BabelParserPlugins = []) => {
    const stmts = parseStmts(code, id, plugins)
    let i = 0
    for (const stmt of stmts) {
      const { n } = stmt
      if (n) {
        if (isPotentialCSSFile(n)) continue
        if (path.isAbsolute(n) || n[0] === '.') {
          continue
        }
        // respect the import sources
        if (!options.importSources?.some(i => n.includes(typeof i === 'string' ? i : i.from))) {
          continue
        }

        const resolved = await ctx.resolve(n, id)
        if (resolved && resolved.id && !resolved.external) {
          if (resolved.id === id) {
            continue
          }
          if (!resolved.id.includes('node_modules')) {
            const p = normalizePath('./' + path.relative(path.dirname(id), resolved.id).replace(/\.\w+$/, ''))
            const start = stmt.s + i
            const end = stmt.e + i
            code = code.slice(0, start) + p + code.slice(end)
            i += p.length - (end - start)
          }
        }
      }
    }
    return code
  }

  const ensureParserOpts = (id: string) => {
    const plugins: BabelParserPlugins = []
    const extension = getExt(id)
    if (extension === 'jsx' || extension === 'tsx') {
      plugins.push('jsx')
    }
    if (extension === 'ts' || extension === 'tsx') {
      plugins.push('typescript')
    }
    return plugins
  }

  const transformWithStyleX = async <T extends TransformWithStyleXType>(pluginName: T, opts: TransformWithStyleXRestOptions<T>) => {
    let plugin: typeof stylexBabelPlugin | typeof extendBabelPlugin
    try {
      plugin = interopDefault(pluginName === 'extend' ? extendBabelPlugin : stylexBabelPlugin)
    } catch (_) {
      plugin = await import(pluginName === 'extend' ? '@stylex-extend/babel-plugin' : '@stylexjs/babel-plugin').then(m => interopDefault(m))
    }
    return transformAsync(opts.code, {
      babelrc: false,
      filename: opts.filename,
      // @ts-expect-error
      plugins: [...(babelConfig?.plugins ?? []), plugin.withOptions(opts.options)],
      presets: babelConfig?.presets,
      parserOpts: opts.parserOpts ?? {}
    })
  }

  // TODO: for more performance, we might need to maintain a dependency graph to invalidate the cache.
  const invalidate = (hmrHash?: string) => {
    for (const server of servers) {
      const updates: Update[] = []
      const mod = server.moduleGraph.getModuleById(CONSTANTS.VIRTUAL_STYLEX_MARK)
      if (!mod) continue
      const nextHash = xxhash(produceCSS())
      if (hmrHash) {
        lastHash = hmrHash
      }
      if (lastHash === nextHash) continue
      lastHash = nextHash
      // check if need to update the css
      server.moduleGraph.invalidateModule(mod)
      const update = {
        type: 'js-update',
        path: '/@id/' + mod.url,
        acceptedPath: '/@id/' + mod.url,
        timestamp: Date.now()
      } satisfies Update
      updates.push(update)
      server.ws.send({ type: 'update', updates })
    }
  }

  // Steps:
  // First, pre scan all files and collect all stylex imports as possible
  // Second, in serve mode generate the css from stylex and inject it to the css plugin
  // Third, in build mode generate the css from stylex and write it to a file

  return [
    {
      name: '@stylex-extend:config',
      enforce: 'pre',
      buildStart() {
        if (!this.meta.watchMode) {
          roots.clear()
          globalCSS = {}
        }
      },
      resolveId(id) {
        if (id === CONSTANTS.VIRTUAL_STYLEX_MARK) {
          return id
        }
      },
      load(id) {
        if (id === CONSTANTS.VIRTUAL_STYLEX_MARK) {
          return { code: produceCSS(), map: { mappings: '' } }
        }
      },
      configureServer(server) {
        servers.push(server)
        // vite's update for HMR are constantly changing. For better compatibility, we need to initate an update
        // notification from the client.
        server.ws.on(WS_EVENT_TYPE, (payload: HMRPayload) => {
          invalidate(payload.hash)
        })
      },
      configResolved(config) {
        isBuild = config.command === 'build'
        for (const plugin of config.plugins) {
          if (plugin.name === 'vite:css' || (isBuild && plugin.name === 'vite:css-post')) {
            cssPlugins.push(plugin)
          }
        }

        if (!options.unstable_moduleResolution) {
          // For monorepo.
          options.unstable_moduleResolution = { type: 'commonJS', rootDir: searchForWorkspaceRoot(config.root) }
        }

        const optimizedDeps = unique([
          ...Array.isArray(options.optimizedDeps) ? options.optimizedDeps : [],
          ...Array.isArray(options.importSources) ? options.importSources.map(s => typeof s === 'string' ? s : s.from) : [],
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
      }
    },
    {
      name: '@stylex-extend:pre-convert',
      enforce: 'pre',
      transform: {
        order: 'pre',
        async handler(code, id) {
          if (macroTransport === false || id.includes('/node_modules/')) return
          // convert all stylex-extend macro to stylex macro
          if (!/\.[jt]sx?$/.test(id) || id.startsWith('\0')) return
          const plugins = ensureParserOpts(id)
          code = await rewriteImportStmts(code, id, this, plugins)

          if (id in globalCSS) {
            // @ts-expect-error
            delete globalCSS[id]
          }

          const res = await transformWithStyleX('extend', {
            code,
            filename: id,
            options: {
              transport: macroTransport,
              classNamePrefix: options.classNamePrefix,
              //  @ts-expect-error
              unstable_moduleResolution: options.unstable_moduleResolution
            },
            parserOpts: { plugins }
          })
          if (res && res.code) {
            if (res.metadata && CONSTANTS.STYLEX_EXTEND_META_KEY in res.metadata) {
              // @ts-expect-error
              globalCSS[id] = res.metadata[CONSTANTS.STYLEX_EXTEND_META_KEY] as string[]
            }

            return { code: res.code, map: res.map }
          }
        }
      }
    },
    {
      name: '@stylex-extend/post-convert',
      enforce: 'post',
      async transform(code, id) {
        if (id.includes('/node_modules/')) return
        if (!filter(id) || isPotentialCSSFile(id) || id.startsWith('\0')) return
        code = await rewriteImportStmts(code, id, this)
        const res = await transformWithStyleX('standard', {
          code,
          filename: id,
          options: {
            ...rest,
            unstable_moduleResolution: options.unstable_moduleResolution,
            runtimeInjection: false,
            dev: isBuild,
            importSources: options.importSources
          }
        })
        if (!res) return
        if (res.metadata && CONSTANTS.STYLEX_META_KEY in res.metadata) {
          // @ts-expect-error
          const meta = res.metadata[CONSTANTS.STYLEX_META_KEY] satisfies Rule[]
          if (meta.length) {
            roots.set(id, new EffectModule(id, meta))
          } else {
            roots.delete(id)
          }
        }

        if (res.code) return { code: res.code, map: res.map }
      }
    },
    {
      name: '@stylex-extend:flush-css',
      apply: 'serve',
      enforce: 'post',

      async transform(code, id) {
        if (roots.has(id)) {
          invalidate()
        }
        const [filename] = id.split('?', 2)
        if (filename === CONSTANTS.VIRTUAL_STYLEX_MARK && code.includes('import.meta.hot')) {
          // inject client hmr notification
          const payload = { hash: xxhash(produceCSS()) } satisfies HMRPayload
          let hmr = `
          try {
           await import.meta.hot.send('${WS_EVENT_TYPE}', ${JSON.stringify(payload)})
          } catch (e) {
           console.warn('[stylex-hmr]', e)
          }
          if (!import.meta.url.includes('?')) await new Promise(resolve => setTimeout(resolve, 100))
          `
          hmr = `;(async function() {${hmr}\n})()`
          hmr = `\nif (import.meta.hot) {${hmr}}`
          return { code: code + hmr, map: { mappings: '' } }
        }
      }
    },
    {
      // we separate the server and build loigc. Although there will be some duplicated code, but it's worth.
      name: '@stylex-extend/vite:build-css',
      apply: 'build',
      enforce: 'pre',
      async renderStart() {
        let css = produceCSS()
        for (const plugin of cssPlugins) {
          if (!plugin.transform) continue
          const transformHook = typeof plugin.transform === 'function' ? plugin.transform : plugin.transform.handler
          const ctx = {
            ...this,
            getCombinedSourcemap: () => {
              throw new Error('getCombinedSourcemap not implemented')
            }
          } satisfies RollupPluginContext
          const res = await transformHook.call(ctx, css, CONSTANTS.VIRTUAL_STYLEX_MARK)
          if (!res) continue
          if (typeof res === 'string') {
            css = res
          }
          if (typeof res === 'object' && res.code) {
            css = res.code
          }
        }
      }
    }
  ]
}
