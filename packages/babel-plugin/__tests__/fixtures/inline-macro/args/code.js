import { inline } from '@stylex-extend/core'

function fn(arg) {
  console.log(arg)
}

fn(inline({ color: 'purple' }))
