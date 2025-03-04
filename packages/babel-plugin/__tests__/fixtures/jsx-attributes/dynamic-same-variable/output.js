import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  $0: (color, propsOtherColor) => ({
    color: {
      default: "purple",
      ":hover": color,
      ":focus": color,
      ":media (max-width: 600px)": propsOtherColor,
      ":active": color,
    },
  }),
});
export function Component(props) {
  const color = "pink";
  return <div {..._props(_styles.$0(color, props.otherColor))} />;
}