<template>
  <SideLogo border-b="1px solid light_border dark:dark_border" />
  <SideMenu class="cus-scroll-y mt-4 h-0 flex-1" />
  <div class="my-12 flex items-center justify-around px-12">
    <UserAvatar v-if="!appStore.collapsed" />
    <MenuCollapse />
  </div>
</template>

<script setup lang="ts">
// 极简布局侧栏：Logo + 菜单之外，底部放用户头像与折叠按钮补位缺失的顶栏；折叠时隐藏头像仅留开关
import { MenuCollapse, SideLogo, SideMenu, UserAvatar } from '@/layouts/components'
import { useAppStore } from '@/store'

const appStore = useAppStore()
</script>
