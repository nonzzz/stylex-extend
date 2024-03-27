import * as _stylexHelper from "@stylexjs/stylex";
const _styles = _stylexHelper.create({
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
const _styles2 = _stylexHelper.create({
  css: {
    fontSize: "16px",
  },
});
function Button() {
  return <button {..._stylexHelper.props(_styles.css)}></button>;
}
export function App() {
  return (
    <div {..._stylexHelper.props(_styles2.css)}>
      <Button />
    </div>
  );
}