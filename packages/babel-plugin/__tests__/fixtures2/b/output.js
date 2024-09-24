import { create as _create, props as _props } from "@stylexjs/stylex";

const _styles = _create({
  "#0": (propsHoverColor) => ({
    font: "16px",
    display: "inline-flex",
    color: {
      defualt: "red",
      ":hover": propsHoverColor,
      ":active": propsActiveColor,
    },
    backgroundColor: propsHoverColor,
  }),
});
export function Component(props) {
  return <div {..._props(_styles["#0"](props.hoverColor))}></div>;
}