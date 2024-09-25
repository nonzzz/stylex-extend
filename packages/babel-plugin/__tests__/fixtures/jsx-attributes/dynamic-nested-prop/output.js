var _create, _props;
import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  "#0": (color, propsDisplay, propsNormalRadius, propsMaxRadius) => ({
    color: color,
    fontSize: "20px",
    display: {
      display: "flex",
      "@media (max-width: 600px)": propsDisplay,
    },
    borderRadius: {
      default: propsNormalRadius,
      "@media (max-width: 600px)": propsMaxRadius,
    },
  }),
});
export function Component(props) {
  const color = "pink";
  return (
    <div
      {..._props(
        _styles["#0"](color, props.display, props.normalRadius, props.maxRadius)
      )}
    />
  );
}