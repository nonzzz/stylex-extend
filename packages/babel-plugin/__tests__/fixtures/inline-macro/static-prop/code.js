import { inline } from '@stylex-extend/core'
import { create } from '@stylexjs/stylex'
import { props } from '@stylexjs/stylex'

const styles = create({
  base: {
    color: 'red'
  }
})

export function Component() {
  return <div {...props(styles.base, inline({ font: '16px', display: 'inline-flex' }))}></div>
}
