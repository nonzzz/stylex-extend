const color = 'red'
const bgColor = 'blue'

const obj = {
  pink: 'pink'
}

const v = true

const fn = () => {}
;(() => {
  return (
    <div
      stylex={{
        fontSize: '16px',
        display: {
          '@media (max-width: 600px)': 'block',
          '@media (min-width: 600px)': 'inline-block'
        },
        backgroundColor: {
          default: fn(),
          '@media (max-width:600px)': color,
          '@media (min-width: 600px)': obj.pink
        },
        border: `1px solid ${color}`,
        color,
        ...v && { display: 'none', sfontSize: '14px', color, backgroundColor: 'purple' },
        ...v && { backgroundColor: 'red' },
        ...vo && { backgroundColor: 'greenx' },
        ...{ fontSize: '12px', color: bgColor },
        backgroundColor: 'green',
        borderRadius: '4px',
        ...v && { backgroundColor: 'dark' }
      }}
    />
  )
})()
