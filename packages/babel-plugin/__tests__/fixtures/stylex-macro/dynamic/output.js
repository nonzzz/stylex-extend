import * as __stylex__extend__helper__ from "@stylexjs/stylex";
const _stylex_extend = __stylex__extend__helper__.create({
  css: {},
  dynamic: (_color, _fontSize) => ({
    color: _color,
    fontSize: _fontSize,
  }),
});
export function App(props) {
  const { color } = props;
  return (
    <div
      {...__stylex__extend__helper__.props(
        _stylex_extend.css,
        _stylex_extend.dynamic(color, props.fontSize)
      )}
    ></div>
  );
}