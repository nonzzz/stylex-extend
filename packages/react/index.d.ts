import type { StylexProperty } from '@stylex-extend/shared'

declare module 'react' {

  interface Attributes {
    stylex?: StylexProperty
  }
}
