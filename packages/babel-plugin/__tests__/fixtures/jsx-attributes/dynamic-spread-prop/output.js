var _create, _props;
import { create as _create, props as _props } from "@stylexjs/stylex";
const visible = true;
const _styles = _create({
  "#0": (color) => ({
    color: color,
    display: "flex",
  }),
  "#1": (propsFontSize, propsFontSizeActive, propsColor, flex) => ({
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
        visible &&
          _styles["#1"](props.fontSize, props.fontSizeActive, props.color, flex)
      )}
    />
  );
}