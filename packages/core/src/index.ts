/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CSSObject, StylexCSS } from '@stylex-extend/shared'
import { attrs } from '@stylexjs/stylex'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReadonlyParmater<T extends (...args: ReadonlyArray<any>) => any> = T extends (...args: ReadonlyArray<infer P>) => any ? P
  : never

export type StylexAttrsParamter = ReadonlyParmater<typeof attrs>

export function injectGlobalStyle(..._: Array<Record<string, StylexCSS>>): string {
  throw new Error("'injectGlobalStyle' calls should be compiled away.")
}

export function inline(_: CSSObject): StylexAttrsParamter {
  throw new Error("'inline' calls should be compiled away.")
}
