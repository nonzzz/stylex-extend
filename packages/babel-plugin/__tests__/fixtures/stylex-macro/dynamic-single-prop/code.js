export function Component(props) {
  const color = 'pink'

  return <div stylex={{ color, fontSize: '20px', display: props.display }} />
}
