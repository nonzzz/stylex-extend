var _create, _props;
const _styles = _create({
  "#0": (a1azs1q1, color) => ({
    fontSize: "16px",
    display: {
      "@media (max-width: 600px)": "block",
      "@media (min-width: 600px)": "inline-block",
    },
    backgroundColor: "green",
    border: a1azs1q1,
    color: color,
  }),
  "#1": (color) => ({
    display: "none",
    sfontSize: "14px",
    color: color,
    backgroundColor: "dark",
  }),
  "#2": {
    backgroundColor: "greenx",
  },
  "#3": (bgColor) => ({
    fontSize: "12px",
    color: bgColor,
    borderRadius: "4px",
  }),
});
import { create as _create, props as _props } from "@stylexjs/stylex";
const color = "red";
const bgColor = "blue";
const obj = {
  pink: "pink",
};
const v = true;
const fn = () => {};
(() => {
  return (
    <div
      {..._props(
        _styles["#0"](`1px solid ${color}`, color),
        v && _styles["#1"](color),
        v && _styles["#2"],
        _styles["#3"](bgColor)
      )}
    />
  );
})();