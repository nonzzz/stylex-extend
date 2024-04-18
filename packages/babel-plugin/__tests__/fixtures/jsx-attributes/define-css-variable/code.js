export function Component(props) {
  const size = '16px'
  return (
    <div stylex={{
      '--font-size-unit': size,
      color: {
        default: null,
        '@media (max-width: 600px)': size ? props.read : props.purple
      }
    }}
    >
    </div>
  )
}
