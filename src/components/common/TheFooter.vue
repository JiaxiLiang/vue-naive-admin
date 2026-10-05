<template>
  <footer class="f-c-c text-14 text-gray-500">
    <p>{{ title }}</p>
  </footer>
</template>

<script setup lang="ts">
// 页脚按需求只展示项目名称（取自 .env 的 VITE_TITLE，与浏览器标题同源）
const title = import.meta.env.VITE_TITLE
</script>
