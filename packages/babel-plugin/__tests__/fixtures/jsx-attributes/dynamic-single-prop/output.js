import { create as _create, props as _props } from "@stylexjs/stylex";
const color = "pink";
const _styles = _create({
  color: {
    color: color,
  },
  fontSize: {
    fontSize: "20px",
  },
  display: (_$mashst) => ({
    display: _$mashst,
  }),
  padding: (_$omo79q) => ({
    padding: _$omo79q,
  }),
});
export function Component(props) {
  const bottom = "10px";
  return (
    <div
      {..._props(
        _styles["color"],
        _styles["fontSize"],
        _styles["display"](props.inline ? "inline" : "block"),
        _styles["padding"](`0 0 ${bottom} 10px`)
      )}
    />
  );
}