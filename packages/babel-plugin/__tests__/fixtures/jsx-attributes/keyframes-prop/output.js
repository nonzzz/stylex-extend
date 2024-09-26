import { create as _create, props as _props } from "@stylexjs/stylex";
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
const _styles = _create({
  "#0": {
    color: "red",
  },
  "#1": {
    display: "flex",
  },
  "#2": (pulse) => ({
    pulse: {
      animationName: pulse,
      animationDuration: "1s",
      animationIterationCount: "infinite",
    },
  }),
  "#3": {
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
    },
  },
});
export function Component() {
  return (
    <div
      {..._props(
        _styles["#0"],
        _styles["#1"],
        _styles["#2"](pulse),
        _styles["#3"]
      )}
    />
  );
}