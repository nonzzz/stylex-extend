import 'react'
import type { StylexProperty } from '@stylex-extend/shared'

type ReactJSXLibraryManagedAttributes<C, P> = JSX.LibraryManagedAttributes<C, P>
type ReactJSXIntrinsicElements = JSX.IntrinsicElements

export namespace StyledJSX {
  export type LibraryManagedAttributes<C, P> = { stylex?: StylexProperty } & ReactJSXLibraryManagedAttributes<C, P>

  export type IntrinsicElements = {
    [K in keyof ReactJSXIntrinsicElements]: ReactJSXIntrinsicElements[K] & {
      stylex?: StylexProperty
    }
  }
}
