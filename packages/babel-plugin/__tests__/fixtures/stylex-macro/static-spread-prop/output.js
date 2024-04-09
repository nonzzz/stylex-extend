import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: {
    color: "red",
  },
  "#1": {
    display: "flex",
  },
  "#2": {
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
    },
  },
});
<div {..._props(_styles["color"], _styles["#1"], _styles["#2"])} />;