import {} from 'vue'
import { StylexProperty } from '@stylex-extend/shared'

declare module 'vue' {
  interface HTMLAttributes {
    stylex?: StylexProperty
  }
}

export {}
