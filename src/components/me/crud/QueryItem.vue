<!-- 搜索项"排版小件" -->
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
withDefaults(defineProps<{
  /** 搜索项标签（模板里有 label === 0 的判断，类型放宽为 string | number） */
  label?: string | number
  labelWidth?: number
  contentWidth?: number
}>(), {
  label: '',
  labelWidth: 80,
  contentWidth: 220,
})
</script>
