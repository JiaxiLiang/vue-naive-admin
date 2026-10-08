<template>
  <div
    id="menu-collapse"
    class="f-c-c cursor-pointer rounded-4 auto-bg-hover p-6 text-22 transition-all-300"
    @click="appStore.switchCollapsed"
  >
    <i :class="appStore.collapsed ? 'i-line-md-menu-unfold-left' : 'i-line-md-menu-fold-left'" />
  </div>
</template>

<script setup lang="ts">
// 侧边栏折叠/展开开关：读写 appStore.collapsed，各布局侧栏与菜单据此收放宽度；id 供新手引导定位
import { useAppStore } from '@/store'

const appStore = useAppStore()
</script>
