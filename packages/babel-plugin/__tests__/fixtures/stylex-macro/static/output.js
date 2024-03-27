import * as __stylex__helper from "@stylexjs/stylex";
const _styles = __stylex__helper.create({
  css: {
    color: {
      default: "var(--blue-link)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "scale(1.1)",
      },
      ":active": "scale(0.9)",
    },
  },
});
const _styles2 = __stylex__helper.create({
  css: {
    fontSize: "16px",
  },
});
function Button() {
  return <button {...__stylex__helper.props(_styles.css)}></button>;
}
export function App() {
  return (
    <div {...__stylex__helper.props(_styles2.css)}>
      <Button />
    </div>
  );
}