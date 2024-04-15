const color = 'pink'

export function Component(props) {
  const bottom = '10px'
  return (
    <div stylex={{ color,
      fontSize: '20px',
      display: props.inline ? 'inline' : 'block',
      padding: `0 0 ${bottom} 10px`
    }}
    />
  )
}
