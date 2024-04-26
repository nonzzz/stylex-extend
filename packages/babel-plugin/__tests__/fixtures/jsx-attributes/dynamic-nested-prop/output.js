import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: (_$color) => ({
    color: _$color,
  }),
  fontSize: {
    fontSize: "20px",
  },
  display: (_$display) => ({
    display: {
      display: "flex",
      "@media (max-width: 600px)": _$display,
    },
  }),
  borderRadius: (_$normalRadius, _$maxRadius) => ({
    borderRadius: {
      default: _$normalRadius,
      "@media (max-width: 600px)": _$maxRadius,
    },
  }),
});
export function Component(props) {
  const color = "pink";
  return (
    <div
      {..._props(
        _styles["color"](color),
        _styles["fontSize"],
        _styles["display"](props.display),
        _styles["borderRadius"](props.normalRadius, props.maxRadius)
      )}
    />
  );
}