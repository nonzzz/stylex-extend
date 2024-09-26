export const Component = () => {
  return (
    <div
      stylex={{
        color: 'red',
        ...{ display: 'flex' },
        ...{
          fontSize: {
            default: '18px',
            '@media (max-width: 768px)': '20px'
          }
        }
      }}
    />
  )
}

export const Component2 = () => {
  const ok = true
  return (
    <div
      stylex={{
        ...ok && { display: 'flex' },
        ...{
          fontSize: {
            default: '18px',
            '@media (max-width: 768px)': '20px'
          }
        }
      }}
    />
  )
}

export const Component3 = () => {
  const ok = true
  const ok2 = true
  return (
    <div
      stylex={{
        color: 'red',
        ...ok && { display: 'flex' },
        ...{
          fontSize: {
            default: '18px',
            '@media (max-width: 768px)': '20px'
          }
        },
        ...ok && { color: 'blue' },
        ...ok2 && { color: 'yellow' },
        boxSizing: 'box'
      }}
    />
  )
}
