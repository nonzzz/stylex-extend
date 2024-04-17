import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: {
    color: "red",
  },
  fontSize: {
    fontSize: {
      default: "16px",
      "@media (min-width: 768px)": "20px",
    },
  },
  textAlign: {
    textAlign: {
      default: "center",
    },
  },
  display: {
    display: "flex",
  },
  lineHeight: {
    lineHeight: 1.5,
  },
});
<div
  {..._props(
    _styles["color"],
    _styles["fontSize"],
    _styles["textAlign"],
    _styles["display"],
    _styles["lineHeight"]
  )}
/>;