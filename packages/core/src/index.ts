import type { StylexCSS } from '@stylex-extend/shared'

export function injectGlobalStyle(..._: Array<Record<string, StylexCSS>>): string {
  throw new Error('\'injectGlobalStyle\' calls should be compiled away.')
}
