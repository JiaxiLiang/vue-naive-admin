<template>
  <div class="wh-full flex">
    <aside
      class="flex-col flex-shrink-0 transition-width-300"
      :class="appStore.collapsed ? 'w-64' : 'w-220'"
      border-r="1px solid light_border dark:dark_border"
    >
      <SideBar />
    </aside>

    <article class="w-0 flex-col flex-1">
      <AppHeader class="h-60 flex-shrink-0" />
      <div class="p-12" border-b="1px solid light_border dark:dark_border">
        <AppTab class="flex-shrink-0" />
      </div>
      <slot />
    </article>
  </div>
</template>

<script setup lang="ts">
// 全屏布局：亮色侧边栏（Logo + 菜单）通栏到底，右侧为顶栏 + 独立页签栏行 + 内容插槽；与 normal 布局的差异在于页签不挤占顶栏、侧栏不带深色底且用边框分隔
import { AppTab } from '@/layouts/components'
import { useAppStore } from '@/store'
import AppHeader from './header/index.vue'
import SideBar from './sidebar/index.vue'

const appStore = useAppStore()
</script>

<style>
.collapsed {
  width: 64px;
}
</style>
