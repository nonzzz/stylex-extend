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

export function id(_?: boolean): string {
  throw new Error('`id` calls should be compiled away.')
}

function createWhenAPI(errorMessage: string) {
  return (selector: string, pseudo?: string): string => {
    throw new Error(errorMessage)
  }
}

/**
 * @description This has not yet been implemented. I think `id` can handle most scenarios.
 */
export const when = {
  // a b
  ancestor: createWhenAPI("'when.ancestor' calls should be compiled away."),
  // a:has(b)
  descendent: createWhenAPI("'when.descendent' calls should be compiled away."),
  // a + b
  sibling: createWhenAPI("'when.sibling' calls should be compiled away.")
}
