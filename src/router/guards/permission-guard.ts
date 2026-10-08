// 核心权限守卫：每次导航先过这道闸，分流顺序：
// 未登录（白名单/去登录）→ 已登录访问登录页踢回首页 → 动态路由未注册则重建并重放 → 已注册放行 → 未注册问后端区分 403/404
import type { RouteLocationRaw, Router, RouteRecordRaw } from 'vue-router'
import api from '@/api'
import { useAuthStore, usePermissionStore, useUserStore } from '@/store'
import { getPermissions, getUserInfo } from '@/store/helper'

// 无需登录即可访问的路径
const WHITE_LIST: string[] = ['/login', '/404']

/**
 * 注册全局前置守卫，负责登录态与权限校验：
 * - 未登录：白名单放行，其余带 redirect 去登录页
 * - 已登录但动态路由未注册（如刷新页面）：拉取用户信息与权限、注册路由后重放目标导航
 * - 目标路由不存在：问后端区分"有菜单但路由缺失（403）"与"页面不存在（404）"
 */
export function createPermissionGuard(router: Router): void {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()
    const token = authStore.accessToken

    if (!token) {
      // 未登录：白名单放行；其余目标存进 redirect，登录成功后可回跳
      if (WHITE_LIST.includes(to.path))
        return true
      return { path: 'login', query: { ...to.query, redirect: to.path } }
    }
    // 已登录访问登录页没有意义，踢回首页
    if (to.path === '/login')
      return { path: '/' }
    if (WHITE_LIST.includes(to.path))
      return true

    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    if (!userStore.userInfo) {
      // token 已持久化、内存态却随刷新清空：需按后端数据重建用户信息、菜单与动态路由
      const [user, permissions] = await Promise.all([getUserInfo(), getPermissions()])
      userStore.setUser(user)
      permissionStore.setPermissions(permissions)
      // 预扫描 views 下全部组件，得到"组件路径 → 懒加载函数"映射，供动态路由按字符串路径取组件
      const routeComponents = import.meta.glob('@/views/**/*.vue')
      permissionStore.accessRoutes.forEach((route) => {
        // store 阶段 component 是后端返回的字符串路径，此处换成真正的懒加载组件；
        // 非字符串形状（理论不可达）与未匹配路径同样按 undefined 处理，最终走 404
        const componentKey = typeof route.component === 'string' ? route.component : undefined
        route.component = (componentKey && routeComponents[componentKey]) || undefined
        // name 即权限 code，恒唯一，先判重避免重复注册
        !router.hasRoute(route.name) && router.addRoute(route as RouteRecordRaw)
      })
      // 动态路由是在本次导航途中注册的，须重放目标路由才能命中新表；
      // replace 避免历史记录里多一条重复项
      return { ...to, replace: true } as RouteLocationRaw
    }

    // 正常访问：目标路由已注册即视为合法，放行
    const routes = router.getRoutes()
    if (routes.some(route => route.name === to.name))
      return true

    // 路由未注册：问后端该路径是否配置了菜单权限，以此区分 403 与 404
    let hasMenu: boolean | undefined
    try {
      const { data } = await api.validateMenuPath(to.path)
      hasMenu = data
    }
    catch (error) {
      // 校验接口异常时兜底按 404 处理，避免导航中断导致 URL 与页面脱节
      console.error(error)
    }
    return hasMenu
      ? { name: '403', query: { path: to.fullPath }, state: { from: 'permission-guard' } }
      : { name: '404', query: { path: to.fullPath } }
  })
}
