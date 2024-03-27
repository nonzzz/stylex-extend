import * as _stylexHelper from "@stylexjs/stylex";
const _styles = _stylexHelper.create({
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
  1: {
    display: "flex",
  },
  2: (_textAlign) => ({
    textAlign: _textAlign,
    background: pink,
  }),
});
export function App(props) {
  const { color } = props;
  return (
    <div
      {..._stylexHelper.props(
        _styles.css,
        _styles.dynamic(color, props.fontSize),
        props.flex && _styles["1"],
        props.align && _styles["2"](props.textAlign)
      )}
    ></div>
  );
}