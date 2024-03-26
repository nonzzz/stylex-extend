import * as __stylex__extend__helper__ from "@stylexjs/stylex";
const _stylex_extend = __stylex__extend__helper__.create({
  css: {
    display: {
      default: "flex",
    },
  },
});
function App() {
  return <div {...__stylex__extend__helper__.props(_stylex_extend.css)} />;
}