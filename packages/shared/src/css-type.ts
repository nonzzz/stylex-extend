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

export type InterpolationPrimitive =
  | null
  | undefined
  | boolean
  | number
  | string
  | CSSObject

export type CSSInterpolation = InterpolationPrimitive
