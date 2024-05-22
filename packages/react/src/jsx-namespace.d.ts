import 'react'
import type { StylexProperty } from '@stylex-extend/shared'

type ReactJSXLibraryManagedAttributes<C, P> = JSX.LibraryManagedAttributes<C, P>
type ReactJSXIntrinsicElements = JSX.IntrinsicElements

type ReactJSXElement = JSX.Element
type ReactJSXElementClass = JSX.ElementClass
type ReactJSXElementAttributesProperty = JSX.ElementAttributesProperty
type ReactJSXElementChildrenAttribute = JSX.ElementChildrenAttribute
type ReactJSXLibraryManagedAttributes<C, P> = JSX.LibraryManagedAttributes<C, P>
type ReactJSXIntrinsicAttributes = JSX.IntrinsicAttributes
type ReactJSXIntrinsicClassAttributes<T> = JSX.IntrinsicClassAttributes<T>
type ReactJSXIntrinsicElements = JSX.IntrinsicElements
type ReactJSXElementType = string | React.JSXElementConstructor<any>

export namespace StyledJSX {
  export type LibraryManagedAttributes<C, P> = { stylex?: StylexProperty } & ReactJSXLibraryManagedAttributes<C, P>

  export type IntrinsicElements = {
    [K in keyof ReactJSXIntrinsicElements]: ReactJSXIntrinsicElements[K] & {
      stylex?: StylexProperty
    }
  }

  export type ElementType = ReactJSXElementType
  export interface Element extends ReactJSXElement {}
  export interface ElementClass extends ReactJSXElementClass {}
  export interface ElementAttributesProperty extends ReactJSXElementAttributesProperty {}
  export interface ElementChildrenAttribute extends ReactJSXElementChildrenAttribute {}

  export interface IntrinsicAttributes extends ReactJSXIntrinsicAttributes {}
  export interface IntrinsicClassAttributes<T> extends ReactJSXIntrinsicClassAttributes<T> {}
}
