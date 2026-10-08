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
// 403 无权限页：权限守卫拦截后跳转到此页，可返回来源页或回首页
const router = useRouter()
const route = useRoute()

// 来源页地址取自 history.state，供"返回上一页"按钮使用
const back = history.state.back

// 区分进入方式：由权限守卫转入时留在本页展示提示；带 path 参数访问时直接重定向到目标路由
if (history.state.from === 'permission-guard') {
  delete history.state.from
}
else if (route.query.path) {
  router.replace(route.query.path as string)
}
</script>
