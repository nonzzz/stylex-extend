import type { Plugin } from 'vite'
import type { Options } from '@stylexjs/babel-plugin'
import type { StylexExtendBabelPluginOptions } from '@stylex-extend/babel-plugin'
import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter } from '@rollup/pluginutils'

type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
type LastOf<T> =
  UnionToIntersection<T extends any ? () => T : never> extends () => (infer R) ? R : never

type Push<T extends any[], V> = [...T, V]

type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> =
  true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>
type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : TuplifyUnion<T[P]>['length'] extends 1 ? T[P] : UnionDeepMutable<TuplifyUnion<T[P]>>[number]
}

type UnionDeepMutable<T extends any[]> = 
  T extends [infer L, ...infer R] 
    ? L extends object 
      ? [DeepMutable<L>, ...UnionDeepMutable<R>]
      : [L, ...UnionDeepMutable<R>]
    : []

type InternalOptions = DeepMutable<Omit<Options, 'dev' | 'runtimeInjection' | 'aliases'>>
// type StylexExtendOptions = Omit<StylexExtendBabelPluginOptions, 'unstable_moduleResolution' | 'classNamePrefix'>

export interface StyleXOptions extends Partial<InternalOptions> {
  include?: FilterPattern
  exclude?: FilterPattern
  optimizedDeps?: Array<string>
}

const defaultOptions = {
  include: /\.(mjs|js|ts|vue|jsx|tsx)(\?.*|)$/,
  importSources: ['stylex', '@stylexjs/stylex']
} satisfies StyleXOptions

const WELL_KNOW_LIBS = ['@stylexjs/open-props']

function unique<T>(data: T[]) {
  return Array.from(new Set(data))
}

export function stylex(options: StyleXOptions = {}): Plugin[] {
  const cssPlugins: Plugin[] = []
  options = { ...defaultOptions, ...options }
  let isSSR = false

  const filter = createFilter(options.include, options.exclude)

  return [
    {
      name: '@stylex-extend/vite:scan',
      enforce: 'pre',
      configResolved(config) {
        isSSR = config.build.ssr !== false && config.build.ssr !== undefined
        for (const plugin of config.plugins) {
          if (plugin.name === 'vite:css' || (config.command === 'build' && plugin.name === 'vite:css-post')) {
            cssPlugins.push(plugin)
          }
        }
        const optimizedDeps = unique([
          ...Array.isArray(options.optimizedDeps) ? options.optimizedDeps : [],
          ...Array.isArray(options.importSources) ? options.importSources.map(s => typeof s === 'string' ? s : s.from) : [],
          ...WELL_KNOW_LIBS
        ])
      },
      transform(code, id) {
        //
      }
    },
    {
      name: '@stylex-extend/vite:serve'
    },
    {
      name: '@stylex-extend/vite:build'
    }
  ]
}
