import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  "#0": (size, t, ctxT, a1c2mtth) => ({
    "--font-size-unit": size,
    display: t,
    textAlign: ctxT,
    color: {
      default: null,
      "@media (max-width: 600px)": a1c2mtth,
    },
  }),
});
function t(s) {
  return s;
}
const ctx = {
  t,
};
export function Component(props) {
  const size = "16px";
  return (
    <div
      {..._props(
        _styles["#0"](
          size,
          t("flex"),
          ctx.t("center"),
          size ? props.read : props.purple
        )
      )}
    ></div>
  );
}