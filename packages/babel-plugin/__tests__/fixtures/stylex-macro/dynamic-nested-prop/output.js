import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: (color) => ({
    color: color,
  }),
  fontSize: {
    fontSize: "20px",
  },
  display: (display) => ({
    display: {
      display: "flex",
      "@media (max-width: 600px)": display,
    },
  }),
  borderRadius: (normalRadius, maxRadius) => ({
    borderRadius: {
      borderRadius: normalRadius,
      "@media (max-width: 600px)": maxRadius,
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