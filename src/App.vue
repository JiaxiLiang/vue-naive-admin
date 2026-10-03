// App.vue是唯一直接挂载在dom上的vue组件 是页面的地基
//  views里面的vue本质上不是完整的一个页面而是设计好的模板直接套到app.vue上
// vue router路由就是根据url决定套那个模板如何套
// pinia状态管理就是管理组件状态
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
import type { LayoutMode } from './settings'
import { darkTheme, dateZhCN, zhCN } from 'naive-ui'
import { LayoutSetting } from '@/components'
import { useAppStore, useTabStore } from '@/store'
import { layoutSettingVisible } from './settings'

const layouts = new Map<string, Component>()
function getLayout(name: string): Component {
  // 利用map将加载过的layout缓存起来，防止重新加载layout导致页面闪烁
  if (layouts.get(name))
    return layouts.get(name)!
  const layout = markRaw(defineAsyncComponent(() => import(`@/layouts/${name}/index.vue`)))
  layouts.set(name, layout)
  return layout
}

const route = useRoute()
const appStore = useAppStore()
// TODO: 原实现的兼容旧持久化值逻辑，'default'/'' 不在 LayoutMode 联合内，保持原行为用断言
if ((appStore.layout as string) === 'default')
  appStore.setLayout('' as LayoutMode)
const Layout = computed(() => {
  if (!route.matched?.length)
    return null
  return getLayout(route.meta?.layout || appStore.layout)
})

const tabStore = useTabStore()
const keepAliveNames = computed(() => {
  return tabStore.tabs.filter(item => item.keepAlive).map(item => item.name as string)
})

watchEffect(() => {
  appStore.setThemeColor(appStore.primaryColor, appStore.isDark)
})
</script>
