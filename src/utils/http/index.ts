// 创建 axios实例 使用设置的五个函数
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { setupInterceptors } from './interceptors'

/** 后端统一响应体（拦截器 resResolve 成功时 resolve 的就是它） */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

/** 拦截器失败时 reject 出来的统一形状（resResolve/resReject 的 reject 参数） */
export interface RequestError {
  code: number | string
  message?: string
  error: unknown
}

/** 扩展 axios 配置：本项目的两个自定义字段 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 本次请求是否携带 token（默认 true） */
  needToken?: boolean
  /** 业务失败时是否弹全局错误提示（默认 true） */
  needTip?: boolean
}

/**
 * 业务代码面向的请求接口（get/post/patch/delete 均返回后端响应体）。
 * 注意逃生舱：非标准响应（如文件流）时拦截器 resolve 的是原始数据，
 * 此时泛型参数收到的是“假 ApiResult”，调用侧自行处理。
 */
export interface HttpClient {
  get: <T = any>(url: string, config?: RequestConfig) => Promise<ApiResult<T>>
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<ApiResult<T>>
  patch: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<ApiResult<T>>
  delete: <T = any>(url: string, config?: RequestConfig) => Promise<ApiResult<T>>
}

// 请求实例 把裸 axios 加工成"装配好拦截器、配好后端地址实例 参数是一般带上的
export function createAxios(options: AxiosRequestConfig = {}): AxiosInstance {
  const defaultOptions: AxiosRequestConfig = {
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

// 响应拦截器已把 axios 的 AxiosResponse 替换为后端响应体，故用自封装的 HttpClient 覆盖 axios 自带类型
export const request: HttpClient = createAxios() as unknown as HttpClient

export const mockRequest: HttpClient = createAxios({
  baseURL: '/mock-api',
}) as unknown as HttpClient
