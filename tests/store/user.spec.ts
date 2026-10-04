import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '@/store/modules/user'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('user store', () => {
  it('getters 在未登录时给出安全兜底（不崩溃）', () => {
    const store = useUserStore()
    expect(store.userId).toBeUndefined()
    expect(store.username).toBeUndefined()
    expect(store.roles).toEqual([])
    expect(store.currentRole).toEqual({})
  })

  it('setUser 后 getters 透出用户信息', () => {
    const store = useUserStore()
    store.setUser({
      id: 1,
      username: 'admin',
      roles: [{ id: 1, name: '管理员' }],
      currentRole: { id: 1, name: '管理员' },
    })
    expect(store.userId).toBe(1)
    expect(store.username).toBe('admin')
    expect(store.roles).toHaveLength(1)
    expect(store.currentRole.name).toBe('管理员')
  })

  it('resetUser 恢复初始空态', () => {
    const store = useUserStore()
    store.setUser({ id: 1, username: 'a', roles: [], currentRole: { id: 1, name: 'x' } })
    store.resetUser()
    expect(store.userInfo).toBeNull()
  })
})
