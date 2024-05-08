import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  "#0": {
    font: "16px",
  },
});
const _styles2 = _create({
  "#0": {
    color: "pink",
    display: "flex",
  },
});
import { inline } from "@stylex-extend/core";
import { create } from "@stylexjs/stylex";
import stylex from "@stylexjs/stylex";
const styles = create({
  base: {
    color: "red",
  },
});
export function Component(props) {
  return (
    <div {...stylex.props(styles.base, _styles["#0"], _styles2["#0"])}></div>
  );
}