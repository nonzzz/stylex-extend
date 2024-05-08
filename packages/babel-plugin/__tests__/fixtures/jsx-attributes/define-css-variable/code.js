function t(s) {
  return s
}

const ctx = { t }

export function Component(props) {
  const size = '16px'
  return (
    <div stylex={{
      '--font-size-unit': size,
      display: t('flex'),
      textAlign: ctx.t('center'),
      color: {
        default: null,
        '@media (max-width: 600px)': size ? props.read : props.purple
      }
    }}
    >
    </div>
  )
}
