import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResult, RequestConfig, RequestError } from './index'
import { isObject } from '@/utils/is'
import { resolveResError } from './helpers'
import { getHttpAuth } from './index'

// 配置拦截器给axios实例使用
export function setupInterceptors(axiosInstance: AxiosInstance): void {
  const SUCCESS_CODES: readonly number[] = [0, 200]
  // 这一个函数要嵌套，主要是它需要上面的SUCCESS_CODES数据。
  // 检查顺利返回的响应体：是 JSON 且业务码在名单上就放行响应体本身
  // 非 JSON（如文件流）时 resolve 原始数据，见 HttpClient 注释
  function resResolve(response: AxiosResponse): Promise<unknown> {
    const { data, status, config, statusText, headers } = response
    // axios 的 header 值类型是 string | string[] | number | boolean | null，运行时 content-type 是字符串
    const contentType = headers['content-type']
    if (typeof contentType === 'string' && contentType.includes('json')) {
      // JSON 响应体按后端契约解析：形状不符（如纯数组/裸字符串）时按 HTTP 状态码兜底
      const payload = isObject(data) ? data as Partial<ApiResult> : undefined
      const bizCode = payload?.code
      if (bizCode !== undefined && SUCCESS_CODES.includes(bizCode))
        return Promise.resolve(data)

      const code = bizCode ?? status
      const needTip = (config as RequestConfig)?.needTip !== false

      // 根据code处理对应的操作，并返回处理后的message
      const message = resolveResError(code, payload?.message ?? statusText, needTip)

      return Promise.reject({ code, message, error: data ?? response })
    }
    return Promise.resolve(data ?? response)
  }

  axiosInstance.interceptors.request.use(reqResolve, reqReject)
  // axios 拦截器类型假设 onFulfilled 仍返回 AxiosResponse，未覆盖"拦截器改写响应体"的官方用法；
  // 运行时 resolve 的是 HttpClient 契约的响应体，该桥接已在验收报告登记豁免
  axiosInstance.interceptors.response.use(
    resResolve as (response: AxiosResponse) => Promise<AxiosResponse>,
    resReject,
  )
}

function reqResolve(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  // 处理不需要token的请求（needToken 是本项目的自定义字段，不在 axios 类型上）
  if ((config as RequestConfig).needToken === false) {
    return config
  }

  const { getAccessToken } = getHttpAuth()
  const accessToken = getAccessToken()
  if (accessToken) {
    // token: Bearer + xxx
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
}

function reqReject(error: unknown): Promise<never> {
  return Promise.reject(error)
}

async function resReject(error: AxiosError<unknown>): Promise<RequestError> {
  if (!error || !error.response) {
    const code = error?.code
    /** 根据code处理对应的操作，并返回处理后的message */
    const message = resolveResError(code, error.message)
    return Promise.reject({ code, message, error })
  }

  const { data, status, config } = error.response
  const payload = isObject(data) ? data as Partial<ApiResult> : undefined
  const code = payload?.code ?? status

  const needTip = (config as RequestConfig)?.needTip !== false
  const message = resolveResError(code, payload?.message ?? error.message, needTip)
  return Promise.reject({ code, message, error: data || error.response })
}
