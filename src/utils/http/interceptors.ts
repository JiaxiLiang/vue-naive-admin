import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResult, RequestConfig, RequestError } from './index'
import { useAuthStore } from '@/store'
import { resolveResError } from './helpers'

// 配置拦截器给axios实例使用
export function setupInterceptors(axiosInstance: AxiosInstance): void {
  const SUCCESS_CODES = [0, 200]
  // 这一个函数要嵌套，主要是它需要上面的SUCCESS_CODES数据。
  // 检查顺利返回的响应体：是 JSON 且业务码在名单上就放行原样上交
  // 非 JSON（如文件流）时 resolve 原始数据，见 HttpClient 注释
  function resResolve(response: AxiosResponse): Promise<ApiResult | any> {
    const { data, status, config, statusText, headers } = response
    // axios 的 header 值类型是 string | string[] | number | boolean | null，运行时 content-type 是字符串
    const contentType = headers['content-type'] as string | undefined
    if (contentType?.includes('json')) {
      if (SUCCESS_CODES.includes(data?.code)) {
        return Promise.resolve(data)
      }
      const code = data?.code ?? status

      const needTip = (config as RequestConfig)?.needTip !== false

      // 根据code处理对应的操作，并返回处理后的message
      const message = resolveResError(code, data?.message ?? statusText, needTip)

      return Promise.reject({ code, message, error: data ?? response })
    }
    return Promise.resolve(data ?? response)
  }

  axiosInstance.interceptors.request.use(reqResolve, reqReject)
  axiosInstance.interceptors.response.use(resResolve, resReject)
}

function reqResolve(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  // 处理不需要token的请求（needToken 是本项目的自定义字段，不在 axios 类型上）
  if ((config as RequestConfig).needToken === false) {
    return config
  }

  const { accessToken } = useAuthStore()
  if (accessToken) {
    // token: Bearer + xxx
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
}

function reqReject(error: any): Promise<any> {
  return Promise.reject(error)
}

async function resReject(error: AxiosError<any>): Promise<RequestError> {
  if (!error || !error.response) {
    const code = error?.code
    /** 根据code处理对应的操作，并返回处理后的message */
    const message = resolveResError(code as number | string, error.message)
    return Promise.reject({ code, message, error })
  }

  const { data, status, config } = error.response
  const code = data?.code ?? status

  const needTip = (config as RequestConfig)?.needTip !== false
  const message = resolveResError(code, data?.message ?? error.message, needTip)
  return Promise.reject({ code, message, error: error.response?.data || error.response })
}
