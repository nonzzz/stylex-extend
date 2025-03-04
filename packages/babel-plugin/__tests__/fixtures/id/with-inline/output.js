import { create as _create, props } from "@stylexjs/stylex";
const myId = {
  $id: "stylex-extend",
  value: "var(--1ulkty)",
};
const _styles = _create({
  $0: {
    "var(--1ulkty)": {
      default: "red",
    },
  },
});
const _styles2 = _create({
  $0: {
    color: "var(--1ulkty)",
    "var(--1ulkty)": {
      default: "28px",
    },
  },
});
const _styles3 = _create({
  $0: {
    fontSize: "var(--1ulkty)",
  },
});
export function Component() {
  return (
    <div {...props(_styles.$0)}>
      <p {...props(_styles2.$0)}>
        First pagination
        <span {...props(_styles3.$0)}>Nested Text</span>
      </p>
    </div>
  );
}