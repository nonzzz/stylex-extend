import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: {
    color: "red",
  },
  fontSize: {
    fontSize: "16px",
  },
});
<div {..._props(_styles["color"], _styles["fontSize"])} />;