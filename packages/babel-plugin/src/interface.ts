export interface StylexBindingMeta {
  helper: 'props' | 'attrs' | (string & {})
}

export interface StylexExtendBabelPluginOptions {
  css: boolean
  stylex: boolean | StylexBindingMeta
}

export type CssObjectValue = {
  [key: string]: CssObjectValue | number | string | undefined
}
