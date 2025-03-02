/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TransformOptions } from '@babel/core'
import { createFilter } from '@rollup/pluginutils'
import type { StylexExtendBabelPluginOptions } from '@stylex-extend/babel-plugin'
import type { CSSOptions, Plugin } from 'vite'
import { searchForWorkspaceRoot } from 'vite'
import { ensureParserOpts, getPlugin, interopDefault, isPotentialCSSFile, transformStyleX } from './compile'
import { WELL_KNOW_LIBS, defaultOptions, unique } from './index'
import type { StyleXOptions } from './index'

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

export function stylex(options: StylexOptionsWithPostcss = {}): Plugin[] {
  options = { ...defaultOptions, ...options }
  const { macroTransport, useCSSLayer = false, optimizedDeps: _, include, postcss: postcssConfig, exclude, babelConfig, ...rest } = options
  const filter = createFilter(include, exclude)

  return [
    {
      name: '@stylex-extend:postcss-resolve',
      async configResolved(config) {
        // Check css transformer
        if (config.css.transformer === 'lightningcss') {
          throw new Error('Lightningcss is not supported by stylex-extend')
        }
        if (typeof config.css.postcss === 'string') {
          throw new Error('Postcss config file is not supported by stylex-extend')
        }
        const rootDir = searchForWorkspaceRoot(config.root)
        if (!options.unstable_moduleResolution) {
          // For monorepo.
          options.unstable_moduleResolution = { type: 'commonJS', rootDir }
        }

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
        // config.css.postcss.
        if (!config.css.postcss) {
          config.css.postcss = {
            plugins: []
          }
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
              [
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
            ]
          }
        })
        config.css.postcss.plugins?.unshift(instance)
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
          const plugins = ensureParserOpts(id)
          if (!plugins) { return }
          const res = await transformStyleX('extend', {
            code,
            filename: id,
            options: {
              transport: macroTransport,
              classNamePrefix: options.classNamePrefix,
              //  @ts-expect-error safe
              unstable_moduleResolution: options.unstable_moduleResolution
            },
            parserOpts: { plugins }
          }, babelConfig)
          if (res && res.code) {
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
            importSources: options.importSources
          }
        }, babelConfig)
        if (res && res.code) {
          return { code: res.code, map: res.map }
        }
      }
    }
  ]
}
