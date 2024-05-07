import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  "#0": (propsHoverColor, propsActiveColor) => ({
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
import { inline } from "@stylex-extend/core";
import { create } from "@stylexjs/stylex";
import { props } from "@stylexjs/stylex";
const styles = create({
  base: {
    color: "red",
  },
});
export function Component(props) {
  return (
    <div
      {...props(
        styles.base,
        _styles["#1"](props.hoverColor, props.activeColor)
      )}
    ></div>
  );
}