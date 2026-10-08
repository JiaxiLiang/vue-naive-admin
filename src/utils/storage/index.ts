import { createStorage } from './storage'

/** 全局默认命名空间前缀：浏览器存储多项目共享，前缀隔离本项目的键 */
const prefixKey = 'vue-naive-admin_'

/** localStorage 工厂：可传 prefixKey 覆盖默认命名空间 */
export function createLocalStorage(option: { prefixKey?: string } = {}) {
  return createStorage({
    prefixKey: option.prefixKey || '',
    storage: localStorage,
  })
}

/** sessionStorage 工厂（会话级存储，标签页关闭即失效） */
export function createSessionStorage(option: { prefixKey?: string } = {}) {
  return createStorage({
    prefixKey: option.prefixKey || '',
    storage: sessionStorage,
  })
}

/** 全局 localStorage 实例 */
export const lStorage = createLocalStorage({ prefixKey })

/** 全局 sessionStorage 实例 */
export const sStorage = createSessionStorage({ prefixKey })
