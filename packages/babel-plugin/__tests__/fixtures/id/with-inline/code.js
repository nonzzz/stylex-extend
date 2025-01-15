import { id, inline } from '@stylex-extend/core'
import { props } from '@stylexjs/stylex'

const myId = id(true)

export function Component() {
  return (
    <div {...props(inline({ [myId]: { default: 'red' } }))}>
      <p {...props(inline({ color: myId, [myId]: { default: '28px' } }))}>
        First pagination
        <span {...props(inline({ fontSize: myId }))}>
          Nested Text
        </span>
      </p>
    </div>
  )
}
