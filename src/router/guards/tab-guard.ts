import type { Router } from 'vue-router'
import { useTabStore } from '@/store'

// 错误页与登录页不生成页签
export const EXCLUDE_TAB = ['/404', '/403', '/login']

/** 跳转成功后把目标路由登记为页签（已存在则由 addTab 更新信息），黑名单页面除外 */
export function createTabGuard(router: Router): void {
  router.afterEach((to) => {
    if (EXCLUDE_TAB.includes(to.path))
      return
    const tabStore = useTabStore()
    const { name, fullPath: path } = to
    const title = to.meta?.title
    const icon = to.meta?.icon
    const keepAlive = to.meta?.keepAlive
    tabStore.addTab({ name, path, title, icon, keepAlive })
  })
}
