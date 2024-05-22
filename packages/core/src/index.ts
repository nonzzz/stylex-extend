import type { CSSObject, StylexCSS } from '@stylex-extend/shared'

export function injectGlobalStyle(..._: Array<Record<string, StylexCSS>>): string {
  throw new Error("'injectGlobalStyle' calls should be compiled away.")
}

export function inline(_: CSSObject): any {
  throw new Error("'inline' calls should be compiled away.")
}
