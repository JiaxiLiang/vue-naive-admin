import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { setupInterceptors } from './interceptors'

/** 后端统一响应体（拦截器 resResolve 成功时 resolve 的就是它） */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

/** 拦截器失败时 reject 出来的统一形状（业务侧 catch 到的都是它） */
export interface RequestError {
  /** HTTP 状态码 / 后端业务码 / axios 错误码（断网时是 'ERR_NETWORK' 这类字符串） */
  code: number | string | undefined
  message?: string
  error: unknown
}

/** axios 配置的项目自定义扩展字段 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 本次请求是否携带 token（默认 true） */
  needToken?: boolean
  /** 业务失败时是否弹全局错误提示（默认 true） */
  needTip?: boolean
  /** 本次请求跳过无感刷新：刷新接口自带此标记防自触发，重放请求带此标记防无限乒乓 */
  skipAuthRefresh?: boolean
}

/**
 * 业务代码面向的请求接口：get/post/patch/delete 直接返回后端响应体（而非 axios 的 AxiosResponse）。
 * 逃生舱：非 JSON 响应（如文件流）时拦截器 resolve 的是原始数据，泛型收到的是"假 ApiResult"，
 * 调用侧自行处理
 */
export interface HttpClient {
  get: <T = unknown>(url: string, config?: RequestConfig) => Promise<ApiResult<T>>
  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<ApiResult<T>>
  patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<ApiResult<T>>
  delete: <T = unknown>(url: string, config?: RequestConfig) => Promise<ApiResult<T>>
}

/** http 层所需的认证能力：token 读取 + 登出 + 静默刷新。由应用入口注入，utils 不反向依赖 store/api */
export interface HttpAuthHandlers {
  getAccessToken: () => string | undefined
  logout: () => void
  /**
   * 静默换新 token：调刷新接口并写入认证仓库，resolve 新 accessToken；reject 表示刷新失败。
   * 未注入则无刷新能力，token 过期直接走登出兜底
   */
  refreshToken?: () => Promise<string>
}

let authHandlers: HttpAuthHandlers | undefined

/** 应用入口在 store 装配完成后调用，把认证能力注入 http 层 */
export function setupHttpAuth(handlers: HttpAuthHandlers): void {
  authHandlers = handlers
}

/** 供拦截器读取注入的认证能力；未初始化说明调用时序错误，立即抛错暴露 */
export function getHttpAuth(): HttpAuthHandlers {
  if (!authHandlers)
    throw new Error('http 层未初始化：请先在应用入口调用 setupHttpAuth()')
  return authHandlers
}

/** 创建装配好拦截器的 axios 实例：默认带上后端地址与 12s 超时，入参可覆盖 */
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

/**
 * 全局请求实例。响应拦截器把 axios 的 AxiosResponse 改写为后端响应体，而 axios 方法级
 * 泛型（默认 AxiosResponse<T>）无法表达这个运行时事实，故断言为自封装的 HttpClient——
 * 这是 axios 类型体系与拦截器改写行为之间的唯一边界
 */
export const request: HttpClient = createAxios() as unknown as HttpClient
