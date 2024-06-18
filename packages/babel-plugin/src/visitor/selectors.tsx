// reference: https://github.com/facebook/stylex/issues/536
// I have not plan to implement the same api in stylex-extend
// Currently support API's
//  - ancestor (a b)
//  - descendent (a:has(b))
//  - sibling (a + b)

// Guessing
// stylex.id isn't have many sense. So declare it by manually

// Steps
// 1. generate a unique id for each style block (Maybe)
// 2. apply selectors api for each style block

// Core Conecpt
// When it comes to avoiding styling at a distance, .csuifyiu:hover > div is unsafe, but div:hover > .ksghfhjsfg is safe.

// Usage:
// import * as stylex from '@stylexjs/stylex'
// import { fly, inline } from '@stylex-extend/core'
// const id = fly('scope')
// export const Card = () => {
//   return <div {...stylex.props(inline({color: 'red'}), id)} />
// }
// export const Others = () => {
//  return <div stylex={{ colors: 'red', [] }} />
// }
//

import { fly, inline, when } from '@stylex-extend/core'

const token = fly('scope')

inline({
  color: {
    default: 'red',
    [when.ancestor(token, ':hover')]: 'blue'
  }
})

// <div>
// </div>
//
