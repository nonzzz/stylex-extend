import { create } from "@stylexjs/stylex";
import stylex from "@stylexjs/stylex";
const myId = "var(--yhn7pe)";
const styles = create({
  base: {
    [myId]: {
      default: "red",
    },
  },
  variant: {
    color: myId,
  },
});
export function Component() {
  return (
    <div {...stylex.props(styles.base)}>
      <div {...stylex.props(styles.variant)}></div>
    </div>
  );
}