<template>
  <main class="cus-scroll h-full flex-col flex-1 bg-#f5f6fb dark:bg-#121212">
    <main :class="{ 'flex-1': full }" class="m-12">
      <slot />
    </main>
    <slot name="footer">
      <TheFooter v-if="showFooter" class="mb-12 mt-auto" />
    </slot>
    <n-back-top :bottom="20" />
  </main>
</template>

<script setup lang="ts">
// 整页滚动型页面容器：内容超高时整页滚动，自带回到顶部按钮与可选页脚
// 适合排版自由的页面；固定表格类布局请用 CommonPage（内容区独立滚动，不撑破视口）
// full：内容区撑满剩余高度；showFooter：页底渲染默认页脚；footer 插槽可整体替换页脚
withDefaults(defineProps<{
  full?: boolean
  showFooter?: boolean
}>(), {
  full: false,
  showFooter: false,
})
</script>
