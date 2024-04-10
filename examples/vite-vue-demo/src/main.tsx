import { createApp, defineComponent } from 'vue'

const A = defineComponent(() => {
  return () => <div>123</div>
})

const App = defineComponent({
  setup() {
    return () => (
      <div stylex={{ color: 'red' }}>
        <A stylex={{ color: 'red' }}></A>
      </div>
    )
  }
})

createApp(App).mount('#app')
