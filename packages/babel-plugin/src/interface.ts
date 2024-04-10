export interface StylexBindingMeta {
  helper: 'props' | 'attrs' | (string & {})
}

export interface StylexExtendBabelPluginOptions {
  css: boolean
  stylex: boolean | StylexBindingMeta
}

export type CSSObjectValue = {
  [key: string]: CSSObjectValue | number | string | undefined | null
}
