<template>
  <footer class="f-c-c text-14 text-gray-500">
    <p>{{ title }}</p>
  </footer>
</template>

<script setup lang="ts">
// 页脚仅展示项目名：取 .env 的 VITE_TITLE，与浏览器标签页标题同源，改一处全局生效
const title = import.meta.env.VITE_TITLE
</script>
