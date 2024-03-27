import {} from 'react'
import { StylexProperty } from '@stylex-extend/shared'

declare function create(args: any): string

declare module 'react' {
  interface Attributes {
    stylex?: StylexProperty;
  }
}
