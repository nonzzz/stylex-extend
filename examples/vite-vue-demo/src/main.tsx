import { injectGlobalStyle } from '@stylex-extend/core'
import { keyframes } from '@stylexjs/stylex'
import { createApp, defineComponent } from 'vue'
import { RouterView, createRouter, createWebHistory, useRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { colors } from './colors.stylex'
import Lang from './lang.vue'
import 'virtual:stylex.css'

// import 'stylex.css'

console.log(colors)

const pulse = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(0.5)' },
  '100%': { transform: 'scale(1)' }
})

const A = defineComponent(() => {
  return () => <div>123</div>
})

const color = 'purple'

export { colors }

injectGlobalStyle({
  p: {
    color: colors.purple
  }
})

const App = defineComponent({
  setup() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const router = useRouter()
    const handleClick = () => {
      router.push({ name: '/xx' }).catch(console.error)
    }

    return () => (
      <>
        <div stylex={{ color: 'green', zIndex: -11 }}>
          456
        </div>
        <p>text</p>
        <A
          stylex={{
            color,
            animationName: pulse,
            animationDuration: '1s',
            animationIterationCount: 'infinite'
          }}
        />
        <Lang />

        <button type="button" onClick={handleClick}>
          Switch to Xx
        </button>
        <RouterView />
      </>
    )
  }
})

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')
