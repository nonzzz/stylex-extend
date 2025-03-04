import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  $0: {
    color: "red",
    fontSize: {
      default: "16px",
      "@media (min-width: 768px)": "20px",
    },
    textAlign: {
      default: "center",
    },
    display: "flex",
    lineHeight: 1.5,
  },
});
<div {..._props(_styles.$0)} />;