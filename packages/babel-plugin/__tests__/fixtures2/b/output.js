import { create, props } from "@stylexjs/stylex";

const _styles2 = create({
  "#0": {
    color: "pink",
    display: "flex",
  },
});
const _styles = create({
  "#0": {
    font: "16px",
  },
});

const styles = create({
  base: {
    color: "red",
  },
});
export function Component(_props) {
  return <div {...props(styles.base, _styles["#0"], _styles2["#0"])}></div>;
}