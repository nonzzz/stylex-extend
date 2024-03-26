function Button() {
  return <button stylex={{ color: { default: 'red', ':hover': 'blue' } }}></button>
}

export function App() {
  return (
    <div stylex={{ fontSize: '16px' }}>
      <Button />
    </div>
  )
}
