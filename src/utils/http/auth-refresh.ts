// Token 无感刷新：单飞锁 + 等待队列 + 原实例重放（纯逻辑模块，锁与队列收在这里便于单测）。
// 痛点对照：旧链路里 token 过期一律弹"重新登录"确认框，用户操作被打断、表单数据丢失；
// 现在过期后后台换新 token 并重放失败请求，只有刷新也失败才回落到原弹窗路径
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { RequestConfig, RequestError } from './index'
import { resolveResError } from './helpers'
import { getHttpAuth } from './index'

// 触发无感刷新的错误码：HTTP 401 与后端业务码 11007/11008（token 过期/无效）
const AUTH_EXPIRED_CODES: readonly number[] = [401, 11007, 11008]

/** 该错误码是否属于"登录过期"类——拦截器的业务码路径（resResolve）与 HTTP 状态路径（resReject）共用 */
export function isAuthExpiredCode(code: number | string | undefined): boolean {
  return typeof code === 'number' && AUTH_EXPIRED_CODES.includes(code)
}

/** 该请求过期时是否值得尝试刷新：刷新接口自身（skipAuthRefresh）与不携带 token 的请求（如登录）过期，都没有可换新的凭证 */
function shouldTryRefresh(config: InternalAxiosRequestConfig): boolean {
  const custom = config as RequestConfig
  return custom.needToken !== false && custom.skipAuthRefresh !== true
}

// ── 单飞锁与等待队列（模块级：整个应用共享一把锁） ──
let isRefreshing = false

/** 挂起中的请求：重放成功后 resolve 把结果归还给原调用方，失败则 reject */
interface PendingRequest {
  config: InternalAxiosRequestConfig
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}
let pendingQueue: PendingRequest[] = []

/**
 * token 过期统一入口（拦截器双路径共用）。
 * @param service 原请求实例——重放走它才能重新经过拦截器，token 注入复用 reqResolve，与首次请求行为完全一致
 * @param failedConfig 触发过期的原始请求配置（重放时原样复用：params/data/headers 都在）
 * @param failed 已经组装好的原始错误（RequestError 形状），兜底/队列放行时原样归还
 * @param needTip 原请求的全局提示开关，兜底弹窗沿用——needTip:false 的过期仍保持静默
 */
export function handleTokenExpired(
  service: AxiosInstance,
  failedConfig: InternalAxiosRequestConfig,
  failed: RequestError,
  needTip: boolean,
): Promise<unknown> {
  if (!shouldTryRefresh(failedConfig))
    return fallBackToRelogin(failed, needTip)

  const { refreshToken } = getHttpAuth()
  // 未注入刷新能力时退化为旧行为：直接弹窗登出
  if (!refreshToken)
    return fallBackToRelogin(failed, needTip)

  // 重放请求带 skipAuthRefresh 标记：新 token 若仍 401，说明刷新已无法自救，
  // 直接走登出兜底——防止"刷新成功但 token 无效"的病态后端下刷新/重放无限乒乓
  const config = failedConfig as RequestConfig
  config.skipAuthRefresh = true

  // 已有刷新在飞：只排队挂起，不再发第二个刷新请求（并发过期只刷新一次）
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      pendingQueue.push({ config: failedConfig, resolve, reject })
    })
  }

  isRefreshing = true
  return refreshToken()
    .then(() => replayAll(service, failedConfig))
    .catch(() => {
      // 刷新失败：队列整体以原始错误放行（调用方收到的错误形状与无刷新时代一致），再走原弹窗登出兜底
      rejectAll(failed)
      return fallBackToRelogin(failed, needTip)
    })
    .finally(() => {
      isRefreshing = false
    })
}

/** 重放当前请求 + 整个等待队列：新 token 已由注入的 refreshToken 写入仓库，reqResolve 重放时注入的就是它 */
function replayAll(service: AxiosInstance, current: InternalAxiosRequestConfig): Promise<unknown> {
  const queue = pendingQueue
  pendingQueue = [] // 先摘队列再重放：重放过程中若再过期会重新走完整流程，不会往旧队列里堆积
  const replay = (config: InternalAxiosRequestConfig): Promise<unknown> =>
    // service.request 运行时 resolve 的是拦截器改写后的响应体（见 HttpClient 的桥接豁免注释）
    service.request(config) as unknown as Promise<unknown>
  queue.forEach(({ config, resolve, reject }) => replay(config).then(resolve, reject))
  return replay(current)
}

function rejectAll(failed: RequestError): void {
  const queue = pendingQueue
  pendingQueue = []
  queue.forEach(({ reject }) => reject({ code: failed.code, message: failed.message, error: failed.error }))
}

/**
 * 兜底路径（保留的旧行为）：复用 resolveResError 的 401/11007/11008 分支弹"是否重新登录"确认框；
 * handleAuthExpired 的 isConfirming 锁保证多请求同时兜底时只弹一次窗
 */
function fallBackToRelogin(failed: RequestError, needTip: boolean): Promise<never> {
  const message = resolveResError(failed.code, failed.message, needTip)
  return Promise.reject({ code: failed.code, message, error: failed.error })
}
