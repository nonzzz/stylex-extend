import { create as _create, props as _props } from "@stylexjs/stylex";
function fn(arg) {
  console.log(arg);
}
const _styles = _create({
  $0: {
    color: "purple",
  },
});
fn(_styles.$0);