import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResult, RequestConfig } from './index'
import { isObject } from '@/utils/is'
import { handleTokenExpired, isAuthExpiredCode } from './auth-refresh'
import { resolveResError } from './helpers'
import { getHttpAuth } from './index'

/** 给 axios 实例装配请求/响应拦截器（createAxios 时调用） */
export function setupInterceptors(axiosInstance: AxiosInstance): void {
  const SUCCESS_CODES: readonly number[] = [0, 200]

  // 响应成功分支：JSON 响应按业务码判定成败，非 JSON（文件流等）原样放行
  // （定义在 setupInterceptors 内，闭包引用 SUCCESS_CODES）
  function resResolve(response: AxiosResponse): Promise<unknown> {
    const { data, status, config, statusText, headers } = response
    // axios 的 header 值类型宽泛（string | string[] | number 等），运行时 content-type 是字符串
    const contentType = headers['content-type']
    if (typeof contentType === 'string' && contentType.includes('json')) {
      // 响应体按后端契约解析：形状不符（纯数组/裸字符串）时按 HTTP 状态码兜底
      const payload = isObject(data) ? data as Partial<ApiResult> : undefined
      const bizCode = payload?.code
      // 业务码在白名单：成功。resolve 响应体本身，业务侧拿到的不再是 AxiosResponse
      if (bizCode !== undefined && SUCCESS_CODES.includes(bizCode))
        return Promise.resolve(data)

      const code = bizCode ?? status
      const needTip = (config as RequestConfig)?.needTip !== false

      // 登录过期类错误改道无感刷新（锁+队列+重放）；刷新失败在其内部回落到重登弹窗
      if (isAuthExpiredCode(code)) {
        return handleTokenExpired(
          axiosInstance,
          config,
          { code, message: payload?.message ?? statusText, error: data ?? response },
          needTip,
        )
      }

      // 其余业务失败：按 code 生成提示文案，并 reject 成统一错误形状
      const message = resolveResError(code, payload?.message ?? statusText, needTip)

      return Promise.reject({ code, message, error: data ?? response })
    }
    return Promise.resolve(data ?? response)
  }

  axiosInstance.interceptors.request.use(reqResolve, reqReject)
  // axios 拦截器类型假定 onFulfilled 仍返回 AxiosResponse，未覆盖"拦截器改写响应体"的官方用法；
  // 运行时 resolve 的是 HttpClient 契约的响应体，此处断言桥接
  axiosInstance.interceptors.response.use(
    resResolve as (response: AxiosResponse) => Promise<AxiosResponse>,
    error => resReject(error, axiosInstance),
  )
}

/** 请求拦截器：默认给请求头注入 Bearer token；needToken:false 的请求（如登录）跳过 */
function reqResolve(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  // needToken 是本项目扩展字段，不在 axios 类型上
  if ((config as RequestConfig).needToken === false) {
    return config
  }

  const { getAccessToken } = getHttpAuth()
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
}

/** 请求拦截器失败分支：不做加工，错误原样向调用方方向传递 */
function reqReject(error: unknown): Promise<never> {
  return Promise.reject(error)
}

/**
 * 响应错误分支：无响应（断网/超时）按 axios 错误码生成提示；有响应且为登录过期类
 * 改道无感刷新，其余按 code 提示并 reject 成统一错误形状
 */
async function resReject(error: AxiosError<unknown>, service: AxiosInstance): Promise<unknown> {
  if (!error || !error.response) {
    const code = error?.code
    const message = resolveResError(code, error.message)
    return Promise.reject({ code, message, error })
  }

  const { data, status, config } = error.response
  const payload = isObject(data) ? data as Partial<ApiResult> : undefined
  const code = payload?.code ?? status

  const needTip = (config as RequestConfig)?.needTip !== false

  // HTTP 层的 401 与业务码路径同归无感刷新入口（双路径接入）
  if (isAuthExpiredCode(code)) {
    return handleTokenExpired(
      service,
      config,
      { code, message: payload?.message ?? error.message, error: data || error.response },
      needTip,
    )
  }

  const message = resolveResError(code, payload?.message ?? error.message, needTip)
  return Promise.reject({ code, message, error: data || error.response })
}
