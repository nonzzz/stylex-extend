function Button() {
  return (
    <button stylex={{
      color: {
        default: 'var(--blue-link)',
        ':hover': {
          default: null,
          '@media (hover: hover)': 'scale(1.1)'
        },
        ':active': 'scale(0.9)'
      }
    }}
    >
    </button>
  )
}

export function App() {
  return (
    <div stylex={{ fontSize: '16px' }}>
      <Button />
    </div>
  )
}
