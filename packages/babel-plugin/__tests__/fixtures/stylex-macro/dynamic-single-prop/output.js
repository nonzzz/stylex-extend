import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: (_$color) => ({
    color: _$color,
  }),
  fontSize: {
    fontSize: "20px",
  },
  display: (_$display) => ({
    display: _$display,
  }),
  padding: (_$padding) => ({
    padding: _$padding,
  }),
});
export function Component(props) {
  const color = "pink";
  const bottom = "10px";
  return (
    <div
      {..._props(
        _styles["color"](color),
        _styles["fontSize"],
        _styles["display"](props.inline ? "inline" : "block"),
        _styles["padding"](`0 0 ${bottom} 10px`)
      )}
    />
  );
}