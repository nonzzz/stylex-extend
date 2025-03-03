import { create as _create, props } from "@stylexjs/stylex";
import { create } from "@stylexjs/stylex";
function include(inlined) {
  return inlined;
}
const _styles = _create({
  $0: {
    color: "purple",
  },
});
const inlined = include(_styles.$0);
export const styles = create({
  base: {
    color: "red",
    fontSize: "16px",
    ...inlined,
  },
});
export const c = props(styles.base);