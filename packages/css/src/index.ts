import type { CSSInterpolation } from '@stylex-extend/shared'

function css(..._: Array<Record<string, CSSInterpolation>>): string {
  throw new Error('css calls should be compiled away.')
}

export { css }
