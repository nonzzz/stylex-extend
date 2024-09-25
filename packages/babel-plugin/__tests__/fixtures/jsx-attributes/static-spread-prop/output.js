import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  "#0": {
    color: "red",
    display: "flex",
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
    },
  },
});
<div {..._props(_styles["#0"])} />;