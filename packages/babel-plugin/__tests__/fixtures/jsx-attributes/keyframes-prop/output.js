import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  "#0": {
    color: "red",
    display: "flex",
    pulse: {
      animationName: pulse,
      animationDuration: "1s",
      animationIterationCount: "infinite",
    },
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
    },
  },
});
const pulse = stylex.keyframes({
  "0%": {
    transform: "scale(1)",
  },
  "50%": {
    transform: "scale(1.1)",
  },
  "100%": {
    transform: "scale(1)",
  },
});
export function Component() {
  return <div {..._props(_styles["#0"])} />;
}