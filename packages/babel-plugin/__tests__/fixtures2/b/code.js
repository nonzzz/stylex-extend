import extend from '@stylex-extend/core'

export function Component(props) {
  return (
    <div
      {...extend.inline({
        font: '16px',
        display: 'inline-flex',
        color: {
          defualt: 'red',
          ':hover': props.hoverColor,
          ':active': props.activeColor
        },
        backgroundColor: props.hoverColor
      })}
    >
    </div>
  )
}
