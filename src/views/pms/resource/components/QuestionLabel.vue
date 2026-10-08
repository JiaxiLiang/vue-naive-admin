<template>
  <span class="flex items-center">
    <n-popover v-if="content" trigger="hover">
      <template #trigger>
        <i class="i-material-symbols:help mr-4" />
      </template>
      <span>{{ content }}</span>
    </n-popover>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
// 表单字段标签组件：label 为主体文字，content 有值时在文字前渲染问号图标，悬停弹出补充说明
// content 缺省时为 undefined，与运行时默认 '' 同为假值，v-if="content" 行为一致
withDefaults(defineProps<{
  label: string
  content?: string
}>(), {
  content: '',
})
</script>
