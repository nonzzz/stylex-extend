import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  "#0": (size, a1c2mtth) => ({
    "--font-size-unit": size,
    color: {
      default: null,
      "@media (max-width: 600px)": a1c2mtth,
    },
  }),
});
export function Component(props) {
  const size = "16px";
  return (
    <div
      {..._props(_styles["#0"](size, size ? props.read : props.purple))}
    ></div>
  );
}