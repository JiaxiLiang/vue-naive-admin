<template>
  <main class="h-full flex-col flex-1 overflow-hidden bg-#f5f6fb dark:bg-#121212">
    <!-- 顶栏：header 插槽可整体替换，否则渲染「返回 + 标题（缺省取路由 meta.title）+ action」默认结构 -->
    <AppCard
      v-if="showHeader"
      class="sticky top-0 z-1 min-h-60 flex items-center justify-between px-24"
    >
      <slot v-if="$slots.header" name="header" />
      <template v-else>
        <div class="flex items-center">
          <slot name="title-prefix">
            <template v-if="back">
              <div
                class="mr-16 flex cursor-pointer items-center text-16 opacity-60 transition-all-300 hover:opacity-40"
                @click="router.back()"
              >
                <i class="i-material-symbols:arrow-left-alt" />
                <span class="ml-4">返回</span>
              </div>
            </template>
          </slot>

          <div class="mr-12 h-16 w-4 rounded-l-2 bg-primary" />
          <h2 class="font-normal">
            {{ title ?? route.meta?.title }}
          </h2>
          <slot name="title-suffix" />
        </div>
        <slot name="action" />
      </template>
    </AppCard>
    <AppCard class="cus-scroll m-12 h-0 flex-1 p-24" bordered>
      <slot />
    </AppCard>

    <slot name="footer">
      <AppCard v-if="showFooter" class="flex-shrink-0 py-12">
        <TheFooter />
      </AppCard>
    </slot>
  </main>
</template>

<script setup lang="ts">
// 标准页面骨架：吸顶标题栏 + 圆角内容卡片（内容区独立滚动）+ 可选页脚
// 业务页通常只写默认插槽；action 插槽放「新增/导出」等按钮，title-prefix 可替换返回按钮区
// back：显示返回按钮（router.back()）；title：缺省取当前路由 meta.title；showHeader：进入纯内容模式
withDefaults(defineProps<{
  back?: boolean
  showFooter?: boolean
  showHeader?: boolean
  title?: string
}>(), {
  back: false,
  showFooter: false,
  showHeader: true,
})
const route = useRoute()
const router = useRouter()
</script>
