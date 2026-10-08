<template>
  <header class="flex items-center border-b border-light_border glass-bar px-12 dark:border-dark_border">
    <MenuCollapse />

    <AppTab class="w-0 flex-1 px-12" />

    <span class="mx-6 opacity-20">|</span>

    <div class="flex flex-shrink-0 items-center px-12 text-18">
      <BeginnerGuide />

      <ToggleTheme />

      <Fullscreen />

      <i
        class="i-fe:github mr-16 cursor-pointer transition hover:text-primary"
        @click="handleLinkClick('https://github.com/zclzone/vue-naive-admin/tree/2.x')"
      />
      <i
        class="i-me:gitee mr-16 cursor-pointer transition hover:text-primary"
        @click="handleLinkClick('https://gitee.com/isme-admin/vue-naive-admin/tree/2.x')"
      />

      <ThemeSetting class="mr-16" />

      <UserAvatar />
    </div>
  </header>
</template>

<script setup lang="ts">
// 常规布局顶栏：左侧折叠按钮 + 多页签栏（页签内嵌顶栏是 normal 与 full 布局的主要差异），右侧为工具区（引导/主题/全屏/仓库链接/主题设置/头像）
import { ToggleTheme } from '@/components'
import { AppTab, BeginnerGuide, Fullscreen, MenuCollapse, UserAvatar } from '@/layouts/components'

/** 新窗口打开仓库地址 */
function handleLinkClick(link: string) {
  window.open(link)
}
</script>
