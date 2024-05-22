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
import { create } from "@stylexjs/stylex";
import stylex from "@stylexjs/stylex";
const styles = create({
  base: {
    color: "red",
  },
});
export function Component(props) {
  return (
    <div
      {...stylex.props(
        styles.base,
        _styles["#0"](props.hoverColor, props.activeColor)
      )}
    ></div>
  );
}