import { inline } from '@stylex-extend/core'
import { create, props } from '@stylexjs/stylex'

const styles = create({
  base: {
    color: 'red'
  }
})

export function Component(_props) {
  return (
    <div
      {...props(
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
