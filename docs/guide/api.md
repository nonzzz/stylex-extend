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

Note: This is not samiler with RFC. function `id` support pass a boolean flag. If pass `true` mean it works for `stylex-extend` self function, the default value is `flase`.
If you want to use `id` with JSXAttribute `stylex` or `inline`. you should decalre a new id with `true`, Don't pass the id set to true to StyleX API itself.

### Usage

```tsx
import { id } from '@stylex-extend/core'
import { create, props } from '@stylexjs/js'

const myId = id()

const myId2 = id(true)

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
      <span stylex={{ [myId2]: { default: 'purple' } }}>
        <span stylex={{ color: myId2 }}>Purple</span>
      </span>
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
