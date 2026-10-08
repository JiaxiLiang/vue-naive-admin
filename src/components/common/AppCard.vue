<template>
  <div class="f-card" :class="{ 'f-card-hover': bordered }">
    <slot />
  </div>
</template>

<script setup lang="ts">
// 基础卡片容器：全站内容的统一外壳，负责圆角/内边距/阴影的默认观感
// bordered：加边框并启用悬浮动效，用于内容区卡片（CommonPage 主体即由它包裹）
defineProps<{
  bordered?: boolean
}>()
</script>
