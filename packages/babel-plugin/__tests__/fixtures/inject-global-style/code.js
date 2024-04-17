import { injectGlobalStyle } from '@stylex-extend/core'
import { expression } from './expression.stylex'

export const styles = injectGlobalStyle({
  html: {
    fontSize: expression.font
  }
})
