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
  /** HTTP 状态码 / 后端业务码 / axios 错误码（断网时是 'ERR_NETWORK' 这类字符串） */
  code: number | string | undefined
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
  get: <T = unknown>(url: string, config?: RequestConfig) => Promise<ApiResult<T>>
  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<ApiResult<T>>
  patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<ApiResult<T>>
  delete: <T = unknown>(url: string, config?: RequestConfig) => Promise<ApiResult<T>>
}

/** http 层所需的认证能力（token 读取 + 过期登出），由应用入口注入，保持 utils 不反向依赖 store */
export interface HttpAuthHandlers {
  getAccessToken: () => string | undefined
  logout: () => void
}

let authHandlers: HttpAuthHandlers | undefined

/** 应用入口在 store 装配完成后调用，把 token 读取与登出动作注入 http 层 */
export function setupHttpAuth(handlers: HttpAuthHandlers): void {
  authHandlers = handlers
}

/** 供拦截器读取注入的认证能力；未初始化说明调用时序错误，立即暴露 */
export function getHttpAuth(): HttpAuthHandlers {
  if (!authHandlers)
    throw new Error('http 层未初始化：请先在应用入口调用 setupHttpAuth()')
  return authHandlers
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

// 响应拦截器把 axios 的 AxiosResponse 重写为后端响应体，而 axios 方法级泛型的返回类型
// （默认 AxiosResponse<T>）无法表达这个运行时事实，故用自封装的 HttpClient 接口收口。
// 该桥接是 axios 类型体系与拦截器改写行为之间的唯一边界（第三方类型局限，已在验收报告登记豁免）
export const request: HttpClient = createAxios() as unknown as HttpClient
