<template>
  <router-link class="h-60 f-c-c" to="/">
    <TheLogo />
    <h2
      v-show="!appStore.collapsed"
      class="ml-10 max-w-140 flex-shrink-0 text-16 text-white font-bold"
    >
      {{ title }}
    </h2>
  </router-link>
</template>

<script setup lang="ts">
// 侧边栏顶部 Logo：点击回到首页；侧栏折叠时收起文字仅留图标
import { useAppStore } from '@/store'

const title = import.meta.env.VITE_TITLE

const appStore = useAppStore()
</script>
