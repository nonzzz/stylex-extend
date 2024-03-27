import * as __stylex__helper from "@stylexjs/stylex";
const _styles = __stylex__helper.create({
  css: {
    borderRadius: "10px",
    border: {
      default: "1px solid red",
    },
  },
  dynamic: (_color, _fontSize) => ({
    color: _color,
    fontSize: _fontSize,
    backgroundColor: {
      default: blue,
      "@media (prefers-color-scheme: dark)": _color,
    },
  }),
});
export function App(props) {
  const { color } = props;
  return (
    <div
      {...__stylex__helper.props(
        _styles.css,
        _styles.dynamic(color, props.fontSize)
      )}
    ></div>
  );
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