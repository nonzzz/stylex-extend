import { createApp, defineComponent } from 'vue'
import { keyframes } from '@stylexjs/stylex'

const pulse = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.1)' },
  '100%': { transform: 'scale(1)' }
})

const A = defineComponent(() => {
  return () => <div>123</div>
})

const color = 'purple'

const App = defineComponent({
  setup() {
    return () => (
      <>
        <div stylex={{ color: 'red' }}>
          456
        </div>
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
