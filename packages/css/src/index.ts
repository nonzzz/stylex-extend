import * as CSS from 'csstype'

export type CSSProperties = CSS.PropertiesFallback<number | string>
export type CSSPropertiesWithMultiValues = {
  [K in keyof CSSProperties]:
  | CSSProperties[K]
  | ReadonlyArray<Extract<CSSProperties[K], string>>
}

export interface CSSObject
  extends CSSPropertiesWithMultiValues,
  // eslint-disable-next-line no-use-before-define
  CSSPseudos,
  // eslint-disable-next-line no-use-before-define
  CSSOthersObject { }

// eslint-disable-next-line no-unused-vars
export type CSSPseudos = { [K in CSS.Pseudos]?: CSSObject }

export interface ArrayCSSInterpolation
  // eslint-disable-next-line no-use-before-define
  extends ReadonlyArray<CSSInterpolation> { }

export type InterpolationPrimitive =
    | null
    | undefined
    | boolean
    | number
    | string
    | CSSObject

export interface CSSOthersObject {
  // eslint-disable-next-line no-use-before-define
  [propertiesName: string]: CSSInterpolation
}

export type CSSInterpolation = InterpolationPrimitive | ArrayCSSInterpolation

function css(..._: Array<Record<string, CSSInterpolation>>): string {
  throw new Error('css calls should be compiled away.')
}

export { css }
