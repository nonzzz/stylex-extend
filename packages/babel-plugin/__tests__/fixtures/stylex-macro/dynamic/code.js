export function App(props) {
  const { color } = props
  return (
    <div stylex={{ color, fontSize: props.fontSize, ...(props.flex && { display: 'flex' }) }}>
    </div>
  )
}
