import type { CSSObject, StylexCSS } from '@stylex-extend/shared'

export function injectGlobalStyle(..._: Array<Record<string, StylexCSS>>): string {
  throw new Error("'injectGlobalStyle' calls should be compiled away.")
}

export function inline(_: CSSObject) {
  throw new Error("'inline' calls should be compiled away.")
}

function createWhenAPI(errorMessage: string) {
  return (selector: string, pseudo?: string) => {
    throw new Error(errorMessage)
  }
}

// https://github.com/facebook/stylex/issues/536
export const when = {
  // a b
  ancestor: createWhenAPI("'when.ancestor' calls should be compiled away."),
  // a:has(b)
  descendent: createWhenAPI("'when.descendent' calls should be compiled away."),
  // a + b
  sibling: createWhenAPI("'when.sibling' calls should be compiled away.")
}

export function fly(_: string): string {
  throw new Error("'fly' calls should be compiled away.")
}
