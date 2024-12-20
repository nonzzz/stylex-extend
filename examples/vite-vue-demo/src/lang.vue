<template>
  <Lang />
</template>

<script setup lang="tsx">
import { defineComponent } from 'vue'

const Lang = defineComponent({
  render() {
    return (
      <div stylex={{ color: 'gray' }}>
        <p>I'm using vue template write JSX</p>
        <div stylex={{ color: 'red', fontSize: '30px' }}>
          FWIW, I hate this way to write JSX! Why not using `.jsx` or `.tsx` to descibe your component ???
        </div>
      </div>
    )
  }
})
</script>
