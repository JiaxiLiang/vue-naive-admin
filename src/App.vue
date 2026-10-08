<template>
  <n-config-provider
    class="wh-full"
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="appStore.isDark ? darkTheme : undefined"
    :theme-overrides="appStore.naiveThemeOverrides"
  >
    <router-view v-if="Layout" v-slot="{ Component, route: curRoute }">
      <component :is="Layout">
        <transition name="fade-slide" mode="out-in" appear>
          <!-- 只缓存页签里标记了 keepAlive 的页面，页签关闭即不再缓存 -->
          <KeepAlive :include="keepAliveNames">
            <component :is="Component" v-if="!tabStore.reloading" :key="curRoute.fullPath" />
          </KeepAlive>
        </transition>
      </component>

      <LayoutSetting v-if="layoutSettingVisible" class="fixed right-12 top-1/2 z-999" />
    </router-view>
  </n-config-provider>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { darkTheme, dateZhCN, zhCN } from 'naive-ui'
import { LayoutSetting } from '@/components'
import { useAppStore, useTabStore } from '@/store'
import { layoutSettingVisible } from './settings'

const layouts = new Map<string, Component>()
/** 按名称懒加载布局组件并缓存，避免布局来回切换时重复加载造成闪烁 */
function getLayout(name: string): Component {
  if (layouts.get(name))
    return layouts.get(name)!
  const layout = markRaw(defineAsyncComponent(() => import(`@/layouts/${name}/index.vue`)))
  layouts.set(name, layout)
  return layout
}

const route = useRoute()
const appStore = useAppStore()
// 兼容旧版本持久化的布局名 'default'（已不在 LayoutMode 内）：置为空串后走 meta.layout 回退
// 仅当 sessionStorage 沿用旧会话值时可达，属既有用户数据兼容
const LEGACY_LAYOUT_VALUES: readonly string[] = ['default']
if (LEGACY_LAYOUT_VALUES.includes(appStore.layout))
  appStore.layout = ''
/** 当前应渲染的布局：路由 meta.layout 优先，缺省回退全局默认布局 */
const Layout = computed(() => {
  if (!route.matched?.length)
    return null
  return getLayout(route.meta?.layout || appStore.layout)
})

const tabStore = useTabStore()
/** KeepAlive 的缓存名单：已开启且标记 keepAlive 的页签对应组件名 */
const keepAliveNames = computed(() => {
  return tabStore.tabs.filter(item => item.keepAlive).map(item => item.name as string)
})

// watchEffect 追踪了主题色与明暗两个依赖，任一变化都会重算色板并同步 CSS 变量
watchEffect(() => {
  appStore.setThemeColor(appStore.primaryColor, appStore.isDark)
})
</script>
