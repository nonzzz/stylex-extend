/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CSSObject, StylexCSS } from '@stylex-extend/shared'

export function injectGlobalStyle(..._: Array<Record<string, StylexCSS>>): string {
  throw new Error("'injectGlobalStyle' calls should be compiled away.")
}

// TODO: until stylex offical expose compile type. we use bool replace it.

export function inline(_: CSSObject): boolean {
  throw new Error("'inline' calls should be compiled away.")
}
