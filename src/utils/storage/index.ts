// 用封装好的类配置成实例，唯一的使用就是在登录页面。
import { createStorage } from './storage'

const prefixKey = 'vue-naive-admin_'

export function createLocalStorage(option: { prefixKey?: string } = {}) {
  return createStorage({
    prefixKey: option.prefixKey || '',
    storage: localStorage,
  })
}

// 会话级存储工厂（2026-10-04 用户决策恢复：为后续功能预留的底座，配套单测见 tests/utils/storage.spec.ts）
export function createSessionStorage(option: { prefixKey?: string } = {}) {
  return createStorage({
    prefixKey: option.prefixKey || '',
    storage: sessionStorage,
  })
}

export const lStorage = createLocalStorage({ prefixKey })

export const sStorage = createSessionStorage({ prefixKey })
