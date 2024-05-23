# APIs

## Inline

- [RFC](https://github.com/facebook/stylex/issues/534#issuecomment-2121745213) in StyleX

### Usage

```tsx
import { create, props } from '@stylexjs/js'
import { inline } from '@stylex-extend/core'

const styles = create({
  summary: {
    color: 'pink'
  }
})

export function Component() {
  return (
    <div {...props(styles.summary, inline({ fontSize: '18px' }))}>
      // ...
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
