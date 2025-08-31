import type { ConfigAPI, PluginItem, TransformOptions } from '@babel/core'
import stylex from '@stylexjs/babel-plugin'
import type { StyleXTransformObj } from '@stylexjs/babel-plugin'
import type { StylexExtendBabelPluginOptions } from './interface'
import { declare as globalStyle } from './plugins/global-style'
import { declare as macro } from './plugins/macro'

type StylexWithOptions = StyleXTransformObj['withOptions']

type StylexOptions = Parameters<StylexWithOptions>[0]

export interface StylexExtendPresetOptions {
  stylex?: StylexOptions
  macro?: StylexExtendBabelPluginOptions
}

function preset(api: ConfigAPI, options: StylexExtendPresetOptions): TransformOptions {
  return {
    plugins: [
      [macro, options.macro || {}],
      [stylex, options.stylex || {}],
      [globalStyle, {}]
    ]
  }
}

function withOptions(options: StylexExtendPresetOptions): PluginItem {
  return [preset, options]
}

preset.withOptions = withOptions

export default preset
