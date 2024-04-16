export interface StylexBindingMeta {
  helper: 'props' | 'attrs' | (string & {})
}

export interface ModuleResolutionCommonJS {
  type: 'commonJS' | 'haste'
  rootDir: string,
  themeFileExtension?: null | undefined | string
}

export interface MOduleResolutionHaste {
  type: 'haste', 
  themeFileExtension?: null | undefined | string
}

export interface ModuleResolutionExperimentalCrossFileParsing {
  type: 'experimental_crossFileParsing',
  rootDir: string,
  themeFileExtension?: null | undefined | string
}

export type ModuleResolution = ModuleResolutionCommonJS | MOduleResolutionHaste | ModuleResolutionExperimentalCrossFileParsing

export interface StylexExtendBabelPluginOptions {
  stylex: boolean | StylexBindingMeta
  enableInjectGlobalStyle?: boolean
  /**
   * @default 'x'
   * @see {@link https://stylexjs.com/docs/api/configuration/babel-plugin/#classnameprefix}
   */
  classNamePrefix?: string
  /**
   * @see {@link https://stylexjs.com/docs/api/configuration/babel-plugin/#unstable_moduleresolution}
   */
  unstable_moduleResolution?: ModuleResolution
}

export type CSSObjectValue = {
  [key: string]: CSSObjectValue | number | string | undefined | null
}
