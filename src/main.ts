// 应用启动入口。初始化顺序有依赖关系：store 必须最先就绪（守卫、指令、离散 API 都依赖仓库），
// 路由就绪后才允许挂载，http 认证注入与离散 API 装配依赖仓库实例
import { darkTheme } from 'naive-ui'
import { createApp } from 'vue'
import api from './api'

import App from './App.vue'
import { setupDirectives } from './directives'
import { setupRouter } from './router'
import { setupStore, useAppStore, useAuthStore } from './store'
import { setupHttpAuth, setupNaiveDiscreteApi } from './utils'

import '@/styles/reset.css'
import '@/styles/global.css'
import 'uno.css'

/**
 * 应用启动入口：按依赖关系串行初始化各插件后挂载
 * await 路由装配是为了让守卫在首屏导航前注册完毕，不漏拦第一次跳转
 */
async function bootstrap() {
  const app = createApp(App)
  setupStore(app)
  setupDirectives(app)
  await setupRouter(app)
  app.mount('#app')

  // 向 http 层注入认证能力（token 读取 + 过期登出 + 无感刷新），utils 层因此不必反向依赖 store/api
  setupHttpAuth({
    getAccessToken: () => useAuthStore().accessToken,
    logout: () => useAuthStore().logout(),
    // 无感刷新：调刷新接口并把新 token 写回仓库，返回新 accessToken 供 http 层确认刷新成功
    refreshToken: async () => {
      const { data } = await api.refreshToken()
      useAuthStore().setToken(data)
      return data.accessToken
    },
  })

  // NaiveUI 离散 API（message/dialog 等）的主题用 computed 注入，随仓库的明暗/主题色变化自动跟随
  const appStore = useAppStore()
  setupNaiveDiscreteApi(computed(() => ({
    theme: appStore.isDark ? darkTheme : undefined,
    themeOverrides: appStore.naiveThemeOverrides,
  })))
}

bootstrap()
