import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  font: {
    font: "16px",
  },
  display: {
    display: "inline-flex",
  },
});
import { inline } from "@stylex-extend/core";
import { create } from "@stylexjs/stylex";
import { props } from "@stylexjs/stylex";
const styles = create({
  base: {
    color: "red",
  },
});
export function Component() {
  return (
    <div {...props(styles.base, _styles["font"], _styles["display"])}></div>
  );
}