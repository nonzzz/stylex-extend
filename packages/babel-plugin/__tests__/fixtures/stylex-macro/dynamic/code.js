export function App(props) {
  const { color } = props
  return (
    <div
      stylex={{
        color,
        borderRadius: '10px',
        fontSize: props.fontSize,
        ...(props.flex && { display: 'flex' }),
        backgroundColor: {
          default: 'blue',
          '@media (prefers-color-scheme: dark)': color
        },
        ...(props.align && {
          textAlign: props.textAlign,
          background: {
            default: 'pink',
            '@media (prefers-color-scheme: dark)': color
          },
          borderRadius: '5px'
        }),
        border: {
          default: '1px solid red'
        }
      }}
    >
    </div>
  )
}
