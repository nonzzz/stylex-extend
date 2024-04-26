import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: (_$color) => ({
    color: _$color,
  }),
  "#1": {
    display: "flex",
  },
  "#2": (_$fontSize, _$fontSizeActive, _$color, _$flex) => ({
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
      ":hover": _$fontSize,
      ":active": _$fontSizeActive,
      ":focus": _$fontSize,
    },
    color: {
      default: "pink",
      hover: _$color,
    },
    display: _$flex,
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
        visible &&
          _styles["#2"](props.fontSize, props.fontSizeActive, props.color, flex)
      )}
    />
  );
}