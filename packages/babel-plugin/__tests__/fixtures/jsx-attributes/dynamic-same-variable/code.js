export function Component(props) {
  const color = 'pink'
    
  return (
    <div stylex={{
      color: {
        default: 'purple',
        ':hover': color,
        ':focus': color,
        ':media (max-width: 600px)': props.otherColor,
        ':active': color
      }
    }}
    />
  )
}
