<template>
  <SideLogo border-b="1px solid light_border dark:dark_border" />
  <SideMenu class="cus-scroll-y mt-4 h-0 flex-1" />
</template>

<script setup lang="ts">
// 全屏布局侧栏：Logo 与菜单纵排，占满侧栏整高；Logo 带底部分隔线配合亮色边框风格
import { SideLogo, SideMenu } from '@/layouts/components'
</script>
