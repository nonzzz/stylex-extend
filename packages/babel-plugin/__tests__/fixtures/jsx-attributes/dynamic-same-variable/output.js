import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: (_$color, _$otherColor) => ({
    color: {
      default: "purple",
      ":hover": _$color,
      ":focus": _$color,
      ":media (max-width: 600px)": _$otherColor,
      ":active": _$color,
    },
  }),
});
export function Component(props) {
  const color = "pink";
  return <div {..._props(_styles["color"](color, props.otherColor))} />;
}