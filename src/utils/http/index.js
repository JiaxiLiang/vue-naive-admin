// 创建 axios实例 使用设置的五个函数
import axios from 'axios'
import { setupInterceptors } from './interceptors'
// 请求实例 把裸 axios 加工成"装配好拦截器、配好后端地址实例 参数是一般带上的
export function createAxios(options = {}) {
  const defaultOptions = {
    baseURL: import.meta.env.VITE_AXIOS_BASE_URL,
    timeout: 12000,
  }
  const service = axios.create({
    ...defaultOptions,
    ...options,
  })
  setupInterceptors(service)
  return service
}

export const request = createAxios()

export const mockRequest = createAxios({
  baseURL: '/mock-api',
})
