import {} from 'react'
import { InterpolationPrimitive } from '@stylex-extend/shared'

declare function create(args: any): string

declare module 'react' {
  interface Attributes {
    stylex?: InterpolationPrimitive;
  }
}
