<template>
  <div class="wh-full flex">
    <aside
      class="flex-col flex-shrink-0 sider-dark transition-width-300"
      :class="appStore.collapsed ? 'w-64' : 'w-220'"
    >
      <SideBar />
    </aside>

    <article class="w-0 flex-col flex-1">
      <AppHeader class="h-60 flex-shrink-0" />
      <slot />
    </article>
  </div>
</template>

<script setup lang="ts">
// 常规布局：左侧深色侧边栏（Logo + 菜单）通栏到底，右侧顶栏内嵌多页签栏，再接内容插槽；是项目最常用的布局形态
import { useAppStore } from '@/store'
import AppHeader from './header/index.vue'
import SideBar from './sidebar/index.vue'

const appStore = useAppStore()
</script>
