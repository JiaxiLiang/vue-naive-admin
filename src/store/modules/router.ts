// 路由仓库：集中持有 router/route 实例与动态路由的卸载能力
// 供登出、换号等非组件环境使用——那些场景拿不到 setup 里的 useRouter
import type { AccessRoute } from '@/types/models'
import { defineStore } from 'pinia'

export const useRouterStore = defineStore('router', () => {
  const router = useRouter()
  const route = useRoute()

  /**
   * 按名字逐个移除动态路由，防止换号后上一个用户的路由残留在路由表里
   * @param accessRoutes 权限仓库登记的动态路由
   */
  function resetRouter(accessRoutes: AccessRoute[]): void {
    accessRoutes.forEach((item) => {
      // 先判存在再移除，静态路由或已卸载的直接跳过
      router.hasRoute(item.name!) && router.removeRoute(item.name!)
    })
  }

  return {
    router,
    route,
    resetRouter,
  }
})
