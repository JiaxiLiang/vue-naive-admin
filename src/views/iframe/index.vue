<template>
  <AppPage full>
    <iframe :src="route.meta.originPath" frameborder="0" class="wh-full" />
  </AppPage>
</template>

<script setup lang="ts">
// 内嵌外链页：按路由 meta.originPath 加载第三方页面，供菜单中以 iframe 方式打开外部地址
const route = useRoute()
</script>
