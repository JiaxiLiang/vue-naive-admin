<template>
  <div class="flex items-center">
    <label v-if="label || label === 0" class="flex-shrink-0" :style="{ width: `${labelWidth}px` }">
      {{ label }}
    </label>
    <div :style="{ width: `${contentWidth}px` }" class="flex-shrink-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// 搜索项排版小件：固定「标签宽 + 内容宽」的两栏布局，保证 MeCrud 搜索栏各字段纵向对齐
// label 放宽为 string | number：模板以 label === 0 判定渲染，数值 0 也是合法标签
withDefaults(defineProps<{
  label?: string | number
  labelWidth?: number
  contentWidth?: number
}>(), {
  label: '',
  labelWidth: 80,
  contentWidth: 220,
})
</script>
