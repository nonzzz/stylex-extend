import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  "--font-size-unit": (_$size) => ({
    "--font-size-unit": _$size,
  }),
  color: (_$1c2mtth) => ({
    color: {
      default: null,
      "@media (max-width: 600px)": _$1c2mtth,
    },
  }),
});
export function Component(props) {
  const size = "16px";
  return (
    <div
      {..._props(
        _styles["--font-size-unit"](size),
        _styles["color"](size ? props.read : props.purple)
      )}
    ></div>
  );
}