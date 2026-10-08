<template>
  <i
    id="fullscreen"
    class="mr-16 cursor-pointer"
    :class="isFullscreen ? 'i-fe:minimize' : 'i-fe:maximize'"
    @click="toggle"
  />
</template>

<script setup lang="ts">
// 全屏切换按钮：对整个文档进入/退出浏览器全屏，图标随状态切换；id 供新手引导定位
import { useFullscreen } from '@vueuse/core'

const { isFullscreen, toggle } = useFullscreen()
</script>
