<template>
  <div>
    <Warn />
  </div>
</template>

<script setup lang="tsx">
import { definePage } from 'unplugin-vue-router/runtime'
import { defineComponent } from 'vue'
definePage({
  alias: ['/n/:name'],
  meta: {
    requiresAuth: true
  }
})

const Warn = defineComponent({
  render() {
    return <div stylex={{ color: 'green' }}>I hate this case. Pls if any other case haddpend try fix it by your self!!!</div>
  }
})
</script>
