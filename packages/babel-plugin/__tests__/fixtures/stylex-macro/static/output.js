import * as __stylex__extend__helper__ from "@stylexjs/stylex";
const _stylex_extend = __stylex__extend__helper__.create({
  css: {
    color: {
      default: "red",
      ":hover": "blue",
    },
  },
});
const _stylex_extend2 = __stylex__extend__helper__.create({
  css: {
    fontSize: "16px",
  },
});
function Button() {
  return (
    <button {...__stylex__extend__helper__.props(_stylex_extend.css)}></button>
  );
}
export function App() {
  return (
    <div {...__stylex__extend__helper__.props(_stylex_extend2.css)}>
      <Button />
    </div>
  );
}