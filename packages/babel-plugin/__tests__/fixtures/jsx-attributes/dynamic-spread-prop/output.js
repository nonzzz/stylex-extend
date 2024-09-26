import { create as _create, props as _props } from "@stylexjs/stylex";
const visible = true;
const _styles = _create({
  "#0": (color) => ({
    color: color,
  }),
  "#1": {
    display: "flex",
  },
  "#2": (propsFontSize, propsFontSizeActive, propsColor, flex) => ({
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
      ":hover": propsFontSize,
      ":active": propsFontSizeActive,
      ":focus": propsFontSize,
    },
    color: {
      default: "pink",
      hover: propsColor,
    },
    display: flex,
  }),
});
export function Component(props) {
  const { color, flex } = props;
  return (
    <div
      {..._props(
        _styles["#0"](color),
        _styles["#1"],
        visible &&
          _styles["#2"](props.fontSize, props.fontSizeActive, props.color, flex)
      )}
    />
  );
}