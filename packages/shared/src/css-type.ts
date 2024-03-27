import * as CSS from 'csstype'

export type CSSProperties = CSS.PropertiesFallback<number | string>

type CSSPropertiesKey = (keyof CSSProperties) | CSS.AtRules | CSS.Pseudos | (string & {})

type SelectOrAtRules = CSS.AtRules | CSS.Pseudos | (string & {})

type CSSPropertiesMoreValue<T> = {
  default: T
} & Partial<Record<SelectOrAtRules, T>>

export type CSSPropertiesWithMultiValues = {
  [K in CSSPropertiesKey]?:
  K extends keyof CSSProperties
    ? (CSSProperties[K] | CSSPropertiesMoreValue<CSSProperties[K]>)
    : CSSPropertiesWithMultiValues | (string & {})
}

export interface CSSObject
  extends CSSPropertiesWithMultiValues { }

export type StylexProperty = CSSObject | ((...args: any[]) => CSSObject)

type CSSPropertiesAndSubKey = (keyof CSSProperties) | CSS.AtRules | `&${CSS.Pseudos}` | (string & {})

export type StylexCSSObject = {
  [K in CSSPropertiesAndSubKey]?:
  K extends keyof CSSProperties
    ? CSSProperties[K]
    : StylexCSSObject | (string & {}) | ((...args: any[]) => StylexCSSObject)
}

export type StylexCSS = StylexCSSObject | ((...args: any[]) => StylexCSSObject) 
