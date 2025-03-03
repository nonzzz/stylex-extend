import { inline } from '@stylex-extend/core'
import { create, props } from '@stylexjs/stylex'

function include(args: ReturnType<typeof inline>) {
  return args
}

const classical = include(inline({ color: 'lightskyblue' }))

const x = create({
  normal: {
    color: 'pink'
  }
})

export function Include() {
  return <div {...props(x.normal, classical)}>Include</div>
}
