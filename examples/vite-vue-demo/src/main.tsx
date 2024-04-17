import { createApp, defineComponent } from 'vue'
import { keyframes } from '@stylexjs/stylex'
import { injectGlobalStyle } from '@stylex-extend/core'
import { colors } from './colors.stylex'

const pulse = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(0.5)' },
  '100%': { transform: 'scale(1)' }
})

const A = defineComponent(() => {
  return () => <div>123</div>
})

const color = 'purple'

injectGlobalStyle({
  p: {
    color: colors.purple
  }
})

const App = defineComponent({

  setup() {
    return () => (
      <>
        <div stylex={{ color: 'red' }}>
          456
        </div>
        <p>text</p>
        <A stylex={{ 
          color,
          animationName: pulse,
          animationDuration: '1s',
          animationIterationCount: 'infinite'
        }}
        >
        </A>
      </>
    )
  }
})

createApp(App).mount('#app')
