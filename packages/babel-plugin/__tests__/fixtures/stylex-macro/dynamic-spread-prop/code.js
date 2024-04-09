const visible = true

export function Component(props) {
  const { color, flex } = props
  return (
    <div stylex={{
      color,
      ...{ display: 'flex' },
      ...visible && { 
        fontSize: {
          default: '18px',
          '@media (max-width: 768px)': '20px'
        },
        color: {
          default: 'pink',
          hover: props.color
        },
        display: flex
      }
    }}
    />
  )
}
