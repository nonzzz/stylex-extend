/* eslint-disable no-use-before-define */
import path from 'path'
import type { HookHandler, Plugin, ViteDevServer } from 'vite'
import { parseSync, transformAsync } from '@babel/core'
import type { Options } from '@stylexjs/babel-plugin'
import { createFilter } from '@rollup/pluginutils'
import type { FilterPattern } from '@rollup/pluginutils'
import stylexBabelPlugin from '@stylexjs/babel-plugin'
import extendBabelPlugin from '@stylex-extend/babel-plugin'
import { normalizePath, searchForWorkspaceRoot } from 'vite'
import type { PluginItem } from '@babel/core'

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
  optimizedDeps?: Array<string>
  /**
   * @default ['stylex', '@stylexjs/stylex']
   * @description https://stylexjs.com/docs/api/configuration/babel-plugin/#importsources
   */
  useCSSLayer?: boolean
  /**
   * @default false
   * @description pipe the product of stylex to PostCSS or LightningCSS
   */
  useCSSProcess?: boolean
  babelConfig?: {
    plugins?: Array<PluginItem>
    presets?: Array<PluginItem>
  }
  /**
   * @default true
   * @description https://nonzzz.github.io/stylex-extend/
   */
  macroOptions?: boolean | {
    helper?: 'props' | 'attrs' | (string & {})
  }
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

function noop() {}

function interopDefault(m: any) {
  return m.default || m
}

const transform: HookHandler<Plugin['transform']> = noop
type RollupPluginContext = ThisParameterType<typeof transform>

const CONSTANTS = {
  REFERENCE_KEY: '@stylex;'
}

const defaultOptions = {
  include: /\.(mjs|js|ts|vue|jsx|tsx)(\?.*|)$/,
  importSources: ['stylex', '@stylexjs/stylex'],
  macroOptions: true
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

export function stylex(options: StyleXOptions = {}): Plugin[] {
  const cssPlugins: Plugin[] = []
  options = { ...defaultOptions, ...options }
  let isSSR = false
  const servers: ViteDevServer[] = []

  // effect scenes only scan stylex import statements.
  // when other's file pipe to stylex compiler.
  // but it might not match the generated kv pairs.
  // such as `import { defineVars } from 'stylex'` and other who execute peval function.

  const effectScenes = new Set<string>()

  const filter = createFilter(options.include, options.exclude)

  const invalidateRoots = (isSSR: boolean) => {
    //
    for (const server of servers) {
      //
    }
  }

  const parseStmts = (code: string, id: string) => {
    const ast = parseSync(code, { filename: id, babelrc: false, parserOpts: { plugins: ['jsx', 'typescript'] } })
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

  const scanFiles = (code: string, id: string) => {
    // const [stmts] = parse(code, id)
    // for (const stmt of stmts) {
    //   const { n } = stmt
    //   if (n) {
    //     if (isPotentialCSSFile(n)) continue
    //     if (options.importSources?.some(i => !path.isAbsolute(n) && n?.includes(typeof i === 'string' ? i : i.from))) {
    //       effectScenes.add(id)
    //       break
    //     }
    //   }
    // }
    // invalidate vite's server
    invalidateRoots(isSSR)
  }

  const rewriteImportStmts = async (code: string, id: string, ctx: RollupPluginContext) => {
    const stmts = parseStmts(code, id)
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

  async function transformWithStyleX<T extends TransformWithStyleXType>(pluginName: T, opts: TransformWithStyleXRestOptions<T>) {
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
      plugins: [plugin.withOptions(opts.options)],
      parserOpts: opts.parserOpts ?? {}
    })
  }

  // Steps:
  // First, pre scan all files and collect all stylex imports as possible
  // Second, in serve mode generate the css from stylex and inject it to the css plugin
  // Third, in build mode generate the css from stylex and write it to a file

  return [
    {
      name: '@stylex-extend/vite:scan',
      enforce: 'pre',
      configureServer(server) {
        servers.push(server)
      },
      configResolved(config) {
        isSSR = config.build.ssr !== false && config.build.ssr !== undefined
        for (const plugin of config.plugins) {
          if (plugin.name === 'vite:css' || (config.command === 'build' && plugin.name === 'vite:css-post')) {
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
        //
      },
      transform(code, id) {
        if (!filter(id)) return
        if (isPotentialCSSFile(id)) return
        scanFiles(code, id)
      }
    },
    {
      name: '@stylex-extend/vite:convert',
      enforce: 'pre',
      transform: {
        order: 'pre',
        async handler(code, id, opt) {
          // convert all stylex-extend macro to stylex macro
          if (!/\.[jt]sx?$/.test(id)) return
          const extension = getExt(id)
          const parseOtions: string[] = []
          if (!extension.endsWith('ts')) {
            parseOtions.push('jsx')
          }
          if (extension === 'tsx' || extension === 'ts') {
            parseOtions.push('typescript')
          }
          code = await rewriteImportStmts(code, id, this)
          const res = await transformWithStyleX('extend', {
            code,
            filename: id,
            options: {
              //  @ts-expect-error
              stylex: typeof options.macroOptions === 'object' ? options.macroOptions : options.macroOptions,
              //  @ts-expect-error
              unstable_moduleResolution: options.unstable_moduleResolution
            },
            parserOpts: { plugins: parseOtions }
          })
          if (res && res.code) {
            return { code: res.code, map: res.map }
          }
        }
      }
    },
    {
      name: '@stylex-extend/vite:serve',
      apply: 'serve',
      enforce: 'post',
      transform(code, id) {
        //
      }
    },
    {
      name: '@stylex-extend/vite:build',
      apply: 'build',
      enforce: 'post'
    }
  ]
}
