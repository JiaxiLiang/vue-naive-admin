<template>
  <i
    id="fullscreen"
    class="mr-16 cursor-pointer"
    :class="isFullscreen ? 'i-fe:minimize' : 'i-fe:maximize'"
    @click="toggle"
  />
</template>

<script setup lang="ts">
import { useFullscreen } from '@vueuse/core'

const { isFullscreen, toggle } = useFullscreen()
</script>
