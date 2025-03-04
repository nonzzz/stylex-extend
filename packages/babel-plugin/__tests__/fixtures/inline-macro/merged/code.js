import { inline } from '@stylex-extend/core'
import { props } from '@stylexjs/stylex'
import { create } from '@stylexjs/stylex'

function include(inlined) {
  return inlined
}

const inlined = include(inline({ color: 'purple' }))

export const styles = create({
  base: {
    color: 'red',
    fontSize: '16px',
    ...inlined
  }
})

export const c = props(styles.base)
