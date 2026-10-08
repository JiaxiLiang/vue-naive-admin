import type { App } from 'vue'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { basicRoutes } from './basic-routes'
import { setupRouterGuards } from './guards'

/**
 * 路由实例：出厂只装静态路由，业务路由由权限守卫按登录结果动态注册
 * history 模式由环境变量切换：hash 模式 URL 带 #，部署无需服务端回退配置
 */
export const router = createRouter({
  history:
    import.meta.env.VITE_USE_HASH === 'true'
      ? createWebHashHistory(import.meta.env.VITE_PUBLIC_PATH || '/')
      : createWebHistory(import.meta.env.VITE_PUBLIC_PATH || '/'),
  routes: basicRoutes,
  // 每次导航后回到顶部，避免滚动位置残留到下一个页面
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

/**
 * 路由装配入口：先注册路由插件，再挂全局守卫
 * @param app Vue 应用实例
 */
export async function setupRouter(app: App): Promise<void> {
  app.use(router)
  // 守卫必须在首屏导航前就位，调用方因此 await 本函数
  setupRouterGuards(router)
}
