# APIs

## Inline

- [RFC](https://github.com/facebook/stylex/issues/534#issuecomment-2121745213) in StyleX

### Usage

```tsx
import { inline } from '@stylex-extend/core'
import { create, props } from '@stylexjs/js'

const styles = create({
  summary: {
    color: 'pink'
  }
})

export function Component() {
  return (
    <div {...props(styles.summary, inline({ fontSize: '18px' }))}>
      <span {...inline({ color: 'blue' })}></span>
    </div>
  )
}
```

## Id

- [RFC](https://github.com/facebook/stylex/discussions/684) in stylex

### Usage

```tsx
import { id } from '@stylex-extend/core'
import { create, props } from '@stylexjs/js'

const myId = id()

const styles = create({
  parent: {
    [myId]: {
      default: 'red',
      ':hover': 'pink'
    }
  },
  child: {
    color: myId
  }
})

export function Component() {
  return (
    <div {...props(styles.parent)}>
      <span {...props(styles.child)}></span>
    </div>
  )
}
```

## injectGlobalStyle

- unoffical API

```ts
import { injectGlobalStyle } from '@stylex-extend/core'
import { colors } from './colors.stylex'

injectGlobalStyle({
  body: {
    fontSize: '30px',
    color: colors.pink,
    '> p': {
      color: 'red'
    }
  }
})
```
