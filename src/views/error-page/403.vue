<template>
  <CommonPage :show-header="false">
    <div class="wh-full f-c-c flex-col">
      <p class="brand-gradient-text text-120 font-bold leading-none">
        403
      </p>
      <p class="mt-16 text-20 font-medium">
        禁止访问
      </p>
      <p class="mt-8 text-14 opacity-50">
        抱歉，您暂无权限访问，请联系管理员开通权限。
      </p>
      <div class="mt-24 flex items-center">
        <n-button v-if="back" type="primary" ghost @click="router.replace(back)">
          返回上一页
        </n-button>
        <n-button type="primary" :class="back ? 'ml-20' : ''" @click="router.replace('/')">
          返回首页
        </n-button>
      </div>
    </div>
  </CommonPage>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const back = history.state.back

if (history.state.from === 'permission-guard') {
  delete history.state.from
}
else if (route.query.path) {
  router.replace(route.query.path as string)
}
</script>
