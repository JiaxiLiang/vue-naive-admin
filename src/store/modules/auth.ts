// 认证状态仓库：登录 Token、Refresh Token 的管理
import { defineStore } from 'pinia' // 引入 Pinia 的 defineStore 方法用于创建仓库
import { usePermissionStore, useRouterStore, useTabStore, useUserStore } from '@/store'
// 引入项目中其他相关的业务仓库（权限、路由、标签页、用户）

export const useAuthStore = defineStore('auth', { // 定义并导出名为 'auth' 的鉴权仓库
  state: () => ({ // 定义仓库的初始状态
    accessToken: undefined as string | undefined, // 访问令牌，初始值为 undefined
  }),
  actions: { // 定义操作 state 的方法集合
    setToken({ accessToken }: { accessToken: string }) {
      // 设置 token 的方法，接收一个包含 accessToken 属性的对象参数
      this.accessToken = accessToken // 将传入的 accessToken 赋值给当前仓库的 state
    },
    resetToken() { // 重置 token 的方法
      this.$reset()
      // 调用 Pinia 内置的 $reset 方法，将当前仓库的 state 重置为初始值
      // $就是框架自带的函数区分自定义 这个函数名字就是$
    },
    toLogin() { // 跳转到登录页的方法
      const { router, route } = useRouterStore()
      // 从路由仓库中解构获取全局路由实例 router 和当前路由对象 route
      router.replace({
        // 使用 router.replace 进行路由跳转（替换当前历史记录，防止用户按后退键退回需登录的页面）
        path: '/login', // 目标跳转路径为登录页
        query: route.query, // 携带当前路由的 query 参数（url  ？后面的）
      })
    },
    async switchCurrentRole(data: { accessToken: string }) { // 异步切换当前用户角色的方法（通常用于多角色账号切换）
      this.resetLoginState() // 1. 先重置所有与登录相关的状态（清空旧角色数据）
      await nextTick() // 2. 等待 Vue 的 DOM 更新和状态重置完成  next函数返回是pro（凭证）得结合await
      this.setToken(data) // 3. 设置新角色的 token 数据
    },
    resetLoginState() { // 核心方法：重置所有与登录相关的全局状态
      const { resetUser } = useUserStore() // 获取用户仓库的重置方法
      const { resetRouter } = useRouterStore() // 获取路由仓库的重置方法
      const { resetPermission, accessRoutes } = usePermissionStore() // 获取权限仓库的重置方法和当前已添加的动态路由表
      const { resetTabs } = useTabStore() // 获取标签页仓库的重置方法
      // 重置路由 提取的本身就是函数
      resetRouter(accessRoutes) // 调用路由重置方法，传入需要移除的动态路由以清理旧路由表
      // 重置用户
      resetUser() // 调用用户重置方法，清空用户信息（如头像、昵称等）
      // 重置权限
      resetPermission() // 调用权限重置方法，清空权限相关状态
      // 重置Tabs
      resetTabs() // 调用标签页重置方法，关闭所有已打开的标签页
      // 重置token
      this.resetToken() // 最后调用自身仓库的重置方法，清空当前 token
    },
    async logout() { // 异步退出登录的方法
      this.resetLoginState() // 1. 调用重置方法，清空所有本地登录状态和数据
      this.toLogin() // 2. 跳转到登录页面
    },
  },
  persist: { // 配置 Pinia 的状态持久化插件
    // key 沿用历史拼写 'naivue'：本地已存会话都挂在这个键下，改成 'naive' 会让既有用户登录态全部失效，
    // 属于用户数据迁移决策，须与旧键迁移方案一起做，不在日常改造中顺手改
    key: 'vue-naivue-admin_auth', // 指定在浏览器本地存储中使用的唯一键名，避免与其他项目冲突
  },
  // 默认使用 localStorage（浏览器自带）
})
/*
[ useAuthStore 仓库 ]
│
▼
┌────────────────────────────┐
│ State: accessToken         │
│ persist: 本地持久化存储    │
└─────────────┬──────────────┘
│
▼
[ Actions 方法触发入口 ]
│
├───────────────────────────────────────┐
│                                       │
▼                                       ▼
┌──────────────────┐            ┌──────────────────┐
│   logout 退出    │            │ switchCurrentRole│
└────────┬─────────┘            └─────────┬────────┘
│                               │
│ [步骤]                        │ [步骤]
│ 1. 调用 resetLoginState       │ 1. 调用 resetLoginState
│ 2. 调用 toLogin               │ 2. await nextTick (等DOM更新)
│                               │ 3. 调用 setToken(data)
│                               │
│ ◄─────────────────────────────┘
│ (共用核心重置逻辑)
▼
┌────────────────────────────────┐
│  resetLoginState 重置登录态    │
├────────────────────────────────┤
│ [1] 引入四大Store的reset方法   │
│ [2] resetRouter(accessRoutes)  │
│ [3] resetUser()                │
│ [4] resetPermission()          │
│ [5] resetTabs()                │
│ [6] this.resetToken()          │
└────────────────────────────────┘
│
▼
┌────────────────┐
│  resetToken    │
├────────────────┤
│ [1] this.$reset│
└───────┬────────┘
│
├───────────────────────────────────────┐
│                                       │
▼                                       ▼
┌──────────────────┐            ┌────────────────┐
│   toLogin 跳转   │            │   setToken     │
├──────────────────┤            ├────────────────┤
│ [1] 获取路由实例 │            │ [1] 解构出token│
│ [2] replace到登录│            │ [2] 更新新token│
└────────┬─────────┘            └───────┬────────┘
│                               │
▼                               ▼
[ 流程结束 ]                    [ 流程结束 ]

*/
