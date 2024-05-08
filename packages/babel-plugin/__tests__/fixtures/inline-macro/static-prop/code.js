import { inline } from '@stylex-extend/core'
import { create } from '@stylexjs/stylex'
import stylex from '@stylexjs/stylex'

const styles = create({
  base: {
    color: 'red'
  }
})

export function Component(props) {
  return (
    <div
      {...stylex.props(
        styles.base,
        inline({
          font: '16px',
          display: 'inline-flex',
          color: {
            defualt: 'red',
            ':hover': props.hoverColor,
            ':active': props.activeColor
          },
          backgroundColor: props.hoverColor
        })
      )}
    >
    </div>
  )
}
