export function Component(props) {
  const color = 'pink'

  return (
    <div
      stylex={{
        color,
        fontSize: '20px',
        display: {
          display: 'flex',
          '@media (max-width: 600px)': props.display
        },
        borderRadius: {
          default: props.normalRadius,
          '@media (max-width: 600px)': props.maxRadius
        }
      }}
    />
  )
}
