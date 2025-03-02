/* eslint-disable no-labels */
// shared with postcss-ver / normal ver
// To be honest, the normal verion is better than the postcss version.
// postcss ver create a new monitor to watch the project and pipe result into vite intenral graph.

// Difference
// normal ver will handle all aliases in plugin side.
// postcss ver will handle all aliases in babel side.

import type { ParserOptions, PluginItem } from '@babel/core'
import { transformAsync } from '@babel/core'
import extendBabelPlugin from '@stylex-extend/babel-plugin'
import stylexBabelPlugin from '@stylexjs/babel-plugin'
import path from 'path'

type BabelParserPlugins = ParserOptions['plugins']

export type TransformType = 'extend' | 'standard'

export interface TransformStyleXOptions<T = TransformType> {
  code: string
  filename: string
  options: T extends 'extend' ? Parameters<typeof extendBabelPlugin.withOptions>[0]
    : Parameters<typeof stylexBabelPlugin.withOptions>[0]
  parserOpts?: ParserOptions
}

export interface BabelConfig {
  plugins?: PluginItem[]
  presets?: PluginItem[]
}

const plugins = new Map<'extend' | 'standard', typeof extendBabelPlugin | typeof stylexBabelPlugin>()

export function interopDefault<T>(m: T | { default: T }): T {
  return (m as { default: T }).default ?? m as T
}

export async function getPlugin<T extends TransformType>(t: T) {
  let plugin: typeof extendBabelPlugin | typeof stylexBabelPlugin = plugins.get(t)!
  if (!plugin) {
    try {
      plugin = interopDefault(t === 'extend' ? extendBabelPlugin : stylexBabelPlugin)
    } catch {
      plugin = await import(t === 'extend' ? '@stylex-extend/babel-plugin' : '@stylexjs/babel-plugin').then((
        m: typeof extendBabelPlugin | typeof stylexBabelPlugin
      ) => interopDefault(m))
    }
    plugins.set(t, plugin)
  }
  return plugin
}

export async function transformStyleX<T extends TransformType>(t: T, opts: TransformStyleXOptions<T>, babelConfig?: BabelConfig) {
  const plugin = await getPlugin(t)
  if (!plugin) { throw new Error('Plugin not found') }
  return transformAsync(opts.code, {
    babelrc: false,
    filename: opts.filename,
    plugins: [
      ...((babelConfig?.plugins) ?? []),
      [plugin, opts.options]
    ],
    presets: babelConfig?.presets ?? [],
    parserOpts: opts.parserOpts,
    generatorOpts: {
      sourceMaps: true
    }
  })
}

export function ensureParserOpts(id: string): BabelParserPlugins | false {
  const plugins: BabelParserPlugins = []
  const [original, ...rest] = id.split('?')
  const extension = path.extname(original).slice(1)
  if (extension === 'jsx' || extension === 'tsx') {
    plugins.push('jsx')
  }
  if (extension === 'ts' || extension === 'tsx') {
    plugins.push('typescript')
  }
  // vue&type=script&lang.tsx
  // vue&type=script&setup=true&lang.tsx
  // For vue and ...etc
  if (extension === 'vue') {
    // Check if is from unplugin-vue-router (Hard code here)
    for (const spec of rest) {
      if (spec.includes('definePage')) {
        return false
      }
    }
    loop: for (;;) {
      const current = rest.shift()
      if (!current) { break loop }
      const matched = current.match(/lang\.(\w+)/)
      if (matched) {
        const lang = matched[1]
        if (lang === 'jsx' || lang === 'tsx') {
          plugins.push('jsx')
        }
        if (lang === 'ts' || lang === 'tsx') {
          plugins.push('typescript')
        }
        break loop
      }
    }
  }
  return plugins
}

function getExt(p: string) {
  const [filename] = p.split('?', 2)
  return path.extname(filename).slice(1)
}

export function isPotentialCSSFile(id: string) {
  const extension = getExt(id)
  return extension === 'css' || (extension === 'vue' && id.includes('&lang.css')) || (extension === 'astro' && id.includes('&lang.css'))
}
