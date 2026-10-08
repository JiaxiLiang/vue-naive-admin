<template>
  <CommonPage show-footer>
    <div w-350>
      <n-input v-model:value="inputVal" />
      <n-input-number v-model:value="number" mt-30 />
      <p mt-20 text-center text-14 color-gray>
        注：右击标签重新加载可重置keep-alive
      </p>
    </div>
  </CommonPage>
</template>

<script setup lang="ts">
// keep-alive 缓存演示页：组件名与路由 keep-alive 匹配，切走再切回时下方输入内容不丢失，用于验证页面缓存机制
defineOptions({ name: 'KeepAlive' })

const inputVal = ref('')
const number = ref(0)
</script>
