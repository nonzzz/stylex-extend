import {} from 'vue'
import { StylexProperty } from '@stylex-extend/shared'

declare module 'vue' {
  interface AriaAttributes {
    stylex?: StylexProperty
  }
  interface ComponentCustomProps {
    stylex?: StylexProperty
  }
}

export {}
