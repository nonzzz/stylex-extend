import type { StylexCSS } from '@stylex-extend/shared'

function css(..._: Array<Record<string, StylexCSS>>): string {
  throw new Error('css calls should be compiled away.')
}

export { css }
