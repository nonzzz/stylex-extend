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
