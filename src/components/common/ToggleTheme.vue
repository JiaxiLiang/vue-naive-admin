<template>
  <i
    id="toggleTheme"
    class="mr-16 cursor-pointer"
    :class="isDark ? 'i-fe:moon' : 'i-fe:sun'"
    @click="toggleDark"
  />
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { useAppStore } from '@/store'

// 明暗主题切换按钮（太阳/月亮图标）：点击时以点击点为圆心播放扩散动画切换两套主题
const appStore = useAppStore()
const isDark = useDark()

/**
 * 切换明暗主题：支持 View Transitions 的浏览器播放圆形扩散过渡（圆心为鼠标点击点），
 * 不支持的浏览器降级为直接切换
 */
async function toggleDark({ clientX, clientY }: MouseEvent) {
  function handler() {
    appStore.toggleDark()
    useToggle(isDark)()
  }

  if (!document.startViewTransition) {
    return handler()
  }

  // 扩散终点半径取点击点到视口最远角的距离，保证圆能覆盖全屏
  const clipPath = [
    `circle(0px at ${clientX}px ${clientY}px)`,
    `circle(${Math.hypot(
      Math.max(clientX, window.innerWidth - clientX),
      Math.max(clientY, window.innerHeight - clientY),
    )}px at ${clientX}px ${clientY}px)`,
  ]

  await document.startViewTransition(handler).ready

  // 动画作用在切换后的快照上：转暗时旧（亮）视图收缩退出，转亮时新视图从点击点扩散进入
  document.documentElement.animate(
    { clipPath: isDark.value ? clipPath.reverse() : clipPath },
    {
      duration: 500,
      easing: 'ease-in',
      pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`,
      fill: 'both',
    },
  )
}
</script>
