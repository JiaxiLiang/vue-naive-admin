// 认证仓库：只负责 token 的存取与登录态的建立/销毁
// 用户资料在 user 仓库、路由权限在 permission 仓库，三者职责分离，由 resetLoginState 统一调度
import { defineStore } from 'pinia'
import { usePermissionStore, useRouterStore, useTabStore, useUserStore } from '@/store'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: undefined as string | undefined,
  }),
  actions: {
    /** 写入新的 accessToken（登录成功或无感刷新拿到新 token 时调用） */
    setToken({ accessToken }: { accessToken: string }) {
      this.accessToken = accessToken
    },
    /** 清空 token，恢复仓库初始值 */
    resetToken() {
      this.$reset()
    },
    /** 跳登录页：replace 防止后退退回需登录页；携带当前 query 便于登录后回跳 */
    toLogin() {
      const { router, route } = useRouterStore()
      router.replace({
        path: '/login',
        query: route.query,
      })
    },
    /** 切换角色：先整体重置登录态（清路由/用户/权限/页签），待重置落定后再写入新角色 token */
    async switchCurrentRole(data: { accessToken: string }) {
      this.resetLoginState()
      // 等 nextTick 让重置引发的视图卸载完成，避免新旧角色状态交叉
      await nextTick()
      this.setToken(data)
    },
    /** 退出/换号的统一清理入口：按 路由 → 用户 → 权限 → 页签 → token 的顺序复位 */
    resetLoginState() {
      const { resetUser } = useUserStore()
      const { resetRouter } = useRouterStore()
      const { resetPermission, accessRoutes } = usePermissionStore()
      const { resetTabs } = useTabStore()
      resetRouter(accessRoutes)
      resetUser()
      resetPermission()
      resetTabs()
      this.resetToken()
    },
    /** 登出：清理全部登录态并回到登录页 */
    async logout() {
      this.resetLoginState()
      this.toLogin()
    },
  },
  // key 沿用历史拼写（'naivue' 系历史笔误）：改名会使既有用户本地登录态全部失效，
  // 属用户数据迁移决策，须与旧键迁移方案一起做，不在日常改造中顺手改
  persist: {
    key: 'vue-naivue-admin_auth',
  },
})
