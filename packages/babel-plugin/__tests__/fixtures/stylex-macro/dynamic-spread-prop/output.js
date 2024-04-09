import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: (color) => ({
    color: color,
  }),
  "#1": {
    display: "flex",
  },
  "#2": (color, flex) => ({
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
    },
    color: {
      default: "pink",
      hover: color,
    },
    display: flex,
  }),
});
const visible = true;
export function Component(props) {
  const { color, flex } = props;
  return (
    <div
      {..._props(
        _styles["color"](color),
        _styles["#1"],
        ...(visible && _styles["#2"](props.color, flex))
      )}
    />
  );
}