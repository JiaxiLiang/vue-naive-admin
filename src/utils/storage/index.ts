// 用封装好的类配置成实例，唯一的使用就是在登录页面。
import { createStorage } from './storage'

const prefixKey = 'vue-naive-admin_'

export function createLocalStorage(option: { prefixKey?: string } = {}) {
  return createStorage({
    prefixKey: option.prefixKey || '',
    storage: localStorage,
  })
}

export const lStorage = createLocalStorage({ prefixKey })
