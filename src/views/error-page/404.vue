<template>
  <CommonPage :show-header="false">
    <div class="wh-full f-c-c flex-col">
      <p class="brand-gradient-text text-120 font-bold leading-none">
        404
      </p>
      <p class="mt-16 text-20 font-medium">
        您访问的页面不存在
      </p>
      <p class="mt-8 text-14 opacity-50">
        生活总归带点荒谬
      </p>
      <n-button class="mt-24" type="primary" @click="replace('/')">
        返回首页
      </n-button>
    </div>
  </CommonPage>
</template>

<script setup lang="ts">
const { replace } = useRouter()
</script>
