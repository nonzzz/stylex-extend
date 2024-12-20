import { props as _props, create } from "@stylexjs/stylex";
import stylex from "@stylexjs/stylex";
const styles = create({
  base: {
    color: "red",
  },
});
const _styles = create({
  "#0": {
    font: "16px",
  },
});
const _styles2 = create({
  "#0": {
    color: "pink",
    display: "flex",
  },
});
export function Component() {
  return (
    <div {...stylex.props(styles.base, _styles["#0"], _styles2["#0"])}></div>
  );
}