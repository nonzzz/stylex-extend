import { createApp, defineComponent } from 'vue'

const App = defineComponent({
  setup() {
    return () => <div stylex={{ color: 'red' }}>123</div>
  }
})

createApp(App).mount('#app')
