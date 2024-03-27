export function App(props) {
  const { color } = props
  return (
    <div stylex={{ 
      color,
      borderRadius: '10px',
      fontSize: props.fontSize,
      ...(props.flex && { display: 'flex' }),
      backgroundColor: {
        default: 'blue',
        '@media (prefers-color-scheme: dark)': color
      },
      border: {
        default: '1px solid red'
      }
    }}
    >
    </div>
  )
}

// expect
// const styles = {
//   css: {
//     borderRadius: '10px'
//   },
//   dynamic: (_color, _fontSize) => ({
//     color: _color,
//     fontSize: _fontSize,
//     backgroundColor: {
//       default: 'blue',
//       '@media (prefers-color-scheme: dark)': _color
//     }
//   }),
//   css1: {
//     display: 'flex'
//   }
// }
