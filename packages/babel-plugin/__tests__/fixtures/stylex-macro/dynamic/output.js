import { create as _create, props as _props } from "@stylexjs/stylex";
const _styles = _create({
  color: (color) => ({
    color: color,
  }),
  borderRadius: {
    borderRadius: "10px",
  },
  fontSize: (fontSize) => ({
    fontSize: fontSize,
  }),
  "#3": {
    display: "flex",
  },
  backgroundColor: (color) => ({
    default: "blue",
    "@media (prefers-color-scheme: dark)": color,
  }),
  "#7": (textAlign, color) => ({
    textAlign: textAlign,
    background: {
      default: "pink",
      "@media (prefers-color-scheme: dark)": color,
    },
    borderRadius: "5px",
  }),
  border: {
    border: {
      default: "1px solid red",
    },
  },
});
export function App(props) {
  const { color } = props;
  return (
    <div
      {..._props(
        _styles.color(color),
        _styles.borderRadius,
        _styles.fontSize(props.fontSize),
        ...(props.flex && _styles["#3"]),
        _styles.backgroundColor(color),
        _styles["#7"](color),
        _styles.border
      )}
    ></div>
  );
}