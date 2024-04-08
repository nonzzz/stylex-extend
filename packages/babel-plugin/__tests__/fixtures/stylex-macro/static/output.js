import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: {
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
const _styles2 = _create({
  fontSize: {
    fontSize: "16px",
  },
});
function Button() {
  return <button {..._props(_styles.color)}></button>;
}
export function App() {
  return (
    <div {..._props(_styles2.fontSize)}>
      <Button />
    </div>
  );
}