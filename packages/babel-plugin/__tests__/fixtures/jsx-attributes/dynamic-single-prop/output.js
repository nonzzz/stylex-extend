import { create as _create, props as _props } from "@stylexjs/stylex";
const color = "pink";
const _styles = _create({
  $0: (color, amashst, aomo79q) => ({
    color: color,
    fontSize: "20px",
    display: amashst,
    padding: aomo79q,
  }),
});
export function Component(props) {
  const bottom = "10px";
  return (
    <div
      {..._props(
        _styles.$0(
          color,
          props.inline ? "inline" : "block",
          `0 0 ${bottom} 10px`
        )
      )}
    />
  );
}