import { inline } from '@stylex-extend/core'
import { create } from '@stylexjs/stylex'
import stylex from '@stylexjs/stylex'

const styles = create({
  base: {
    color: 'red'
  }
})

export function Component() {
  return (
    <div
      {...stylex.props(
        styles.base,
        inline({
          font: '16px'
        }),
        inline({ color: 'pink', display: 'flex' })
      )}
    >
    </div>
  )
}
