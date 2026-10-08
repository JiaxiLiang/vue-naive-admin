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
      <slot />
    </article>
  </div>
</template>

<script setup lang="ts">
// 极简布局：仅左侧侧边栏 + 内容插槽，无顶栏和页签栏，用户/折叠操作收纳进侧栏底部；适合轻量后台或演示页面
import { useAppStore } from '@/store'
import SideBar from './sidebar/index.vue'

const appStore = useAppStore()
</script>

<style>
.collapsed {
  width: 64px;
}
</style>
