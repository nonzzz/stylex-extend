import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  "#0": {
    color: "red",
  },
  "#1": {
    display: "flex",
  },
  "#2": {
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
    },
  },
});
export const Component = () => {
  return <div {..._props(_styles["#0"], _styles["#1"], _styles["#2"])} />;
};
const _styles2 = _create({
  "#0": {
    display: "flex",
  },
  "#1": {
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
    },
  },
});
export const Component2 = () => {
  const ok = true;
  return <div {..._props(ok && _styles2["#0"], _styles2["#1"])} />;
};
const _styles3 = _create({
  "#0": {
    color: "red",
  },
  "#1": {
    display: "flex",
  },
  "#2": {
    fontSize: {
      default: "18px",
      "@media (max-width: 768px)": "20px",
    },
  },
  "#3": {
    color: "blue",
  },
  "#4": {
    color: "yellow",
  },
  "#5": {
    boxSizing: "box",
  },
});
export const Component3 = () => {
  const ok = true;
  const ok2 = true;
  return (
    <div
      {..._props(
        _styles3["#0"],
        ok && _styles3["#1"],
        _styles3["#2"],
        ok && _styles3["#3"],
        ok2 && _styles3["#4"],
        _styles3["#5"]
      )}
    />
  );
};