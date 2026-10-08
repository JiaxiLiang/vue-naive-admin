// 用户仓库：存当前登录用户的资料与角色
// 认证凭证在 auth 仓库、可访问路由在 permission 仓库，职责分离
import type { Role, UserInfo } from '@/types/models'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null as UserInfo | null,
  }),
  getters: {
    // 各派生值在未登录（userInfo 为 null）时给出安全兜底
    userId: state => state.userInfo?.id,
    username: state => state.userInfo?.username,
    nickName: state => state.userInfo?.nickName,
    avatar: state => state.userInfo?.avatar,
    currentRole: state => state.userInfo?.currentRole ?? ({} as Role),
    roles: state => state.userInfo?.roles || [],
  },
  actions: {
    /** 写入用户信息（登录后或刷新页面时由权限守卫调用） */
    setUser(user: UserInfo) {
      this.userInfo = user
    },
    /** 清空用户信息（登出/换号时调用） */
    resetUser() {
      this.$reset()
    },
  },
})
