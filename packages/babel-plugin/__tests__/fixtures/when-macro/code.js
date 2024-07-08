import { create, props } from '@stylexjs/stylex'
import { fly, when } from '@stylex-extend/core'

const style_1 = create({
  text: {
    color: 'red'
  }
})

const id = fly(style_1.text.color)

const style_2 = create({
  variant: {
    color: {
      default: 'blue',
      [when.ancestor(id)]: 'green'
    }
  }
})

export function Component() {
  return (
    <>
      <div
        {...props(
          style_1.text
        )}
      >
        <span>red</span>
        <div {...props(style_2.variant)}>
          <span>green</span>
        </div>
      </div>
      <span {...props(style_2.variant)}>blue</span>
    </>
  )
}
