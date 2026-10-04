import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { WrappedDialog, WrappedMessage } from '@/types/global'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAxios, setupHttpAuth } from '@/utils/http'

/** 受控时序的 Promise：手动决定刷新何时兑现（模拟刷新接口的慢响应） */
function deferred() {
  let resolve!: (token: string) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

type RouteHandler = (config: InternalAxiosRequestConfig) => { status?: number, data: unknown }

/** 可编程后端桩：按 url 片段路由，真实经过完整拦截器链（含无感刷新） */
function createService(routes: Record<string, RouteHandler>) {
  return createAxios({
    adapter: (async (config) => {
      const url = config.url ?? ''
      const handler = Object.entries(routes).find(([pattern]) => url.includes(pattern))?.[1]
      const outcome = handler
        ? handler(config)
        : { data: { code: 200, message: 'ok', data: null } }
      const status = outcome.status ?? 200
      const res: AxiosResponse = {
        data: outcome.data,
        status,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
      }
      if (status >= 400)
        throw new AxiosError('Request failed', status === 401 ? 'ERR_BAD_REQUEST' : 'ERR_BAD_RESPONSE', config, {}, res)
      return res
    }) as AxiosAdapter,
  })
}

describe('token 无感刷新（锁+队列+重放）', () => {
  /** 每用例独立的可观察认证状态 */
  let currentToken: string
  let refreshTokenCalls: number
  let refreshGate: ReturnType<typeof deferred> | undefined
  let refreshShouldFail: boolean
  let logout: ReturnType<typeof vi.fn>
  let dialogConfirm: ReturnType<typeof vi.fn>
  /** 记录各端点最近一次收到的 Authorization，验证重放/新请求携带的 token */
  let lastAuthByEndpoint: Record<string, string>

  /** 释放 helpers.handleAuthExpired 的 isConfirming 模块锁：不点确认/取消的用例结束时调用，防跨用例污染 */
  function releaseDialogLock(): void {
    dialogConfirm.mock.calls.forEach(([options]) => (options as { cancel?: () => void }).cancel?.())
  }

  beforeEach(() => {
    currentToken = 'old-token'
    refreshTokenCalls = 0
    refreshGate = undefined
    refreshShouldFail = false
    lastAuthByEndpoint = {}
    logout = vi.fn()
    dialogConfirm = vi.fn()
    window.$message = {
      error: vi.fn(),
      success: vi.fn(),
      loading: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      destroy: vi.fn(),
    } as unknown as WrappedMessage
    window.$dialog = { confirm: dialogConfirm } as unknown as WrappedDialog

    setupHttpAuth({
      getAccessToken: () => currentToken,
      logout: () => logout(),
      refreshToken: async () => {
        refreshTokenCalls++
        if (refreshGate) {
          const token = await refreshGate.promise
          currentToken = token
          return token
        }
        if (refreshShouldFail)
          throw new Error('刷新失败（mock 模拟，拒绝原因形状不影响兜底逻辑）')
        currentToken = 'new-token'
        return currentToken
      },
    })
  })

  /** 业务端点：前 failTimes 次返回业务码 401，之后成功并回显请求头里的 token */
  function bizRoute(failTimes: number) {
    let calls = 0
    return {
      getCalls: () => calls,
      handler: (): RouteHandler => (config) => {
        calls++
        lastAuthByEndpoint['/biz'] = String(config.headers?.Authorization ?? '')
        if (calls <= failTimes)
          return { data: { code: 401, message: 'token 已过期', data: null } }
        return { data: { code: 200, message: 'ok', data: `payload#${calls}` } }
      },
    }
  }

  it('场景 1：业务码 401 → 静默刷新一次 → 重放成功，调用方无感拿到结果', async () => {
    const biz = bizRoute(1)
    const service = createService({ '/biz': biz.handler() })

    // 裸实例经拦截器改写，await 到的就是响应体 { code, message, data }
    const res = await service.get('/biz')

    expect(res.data).toBe('payload#2')
    expect(refreshTokenCalls).toBe(1)
    expect(biz.getCalls()).toBe(2)
    expect(lastAuthByEndpoint['/biz']).toBe('Bearer new-token')
    expect(dialogConfirm).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })

  it('场景 2：HTTP 401（非 JSON 业务码）走同一刷新入口', async () => {
    let calls = 0
    const service = createService({
      '/biz': () => {
        calls++
        if (calls === 1)
          return { status: 401, data: 'Unauthorized' }
        return { data: { code: 200, message: 'ok', data: 'replayed' } }
      },
    })

    const res = await service.get('/biz')

    expect(res.data).toBe('replayed')
    expect(refreshTokenCalls).toBe(1)
    expect(calls).toBe(2)
  })

  it('场景 3（矩阵#1）：一屏 5 个请求同时 401，刷新接口只调 1 次，5 个全部拿到结果', async () => {
    const biz = bizRoute(5) // 5 个并发请求各自的首发都 401
    const service = createService({ '/biz': biz.handler() })
    // 刷新挂起期间后续 401 才会入队（真实网络里刷新必然慢于本地 401 处理，桩里用门控复现此时序）
    refreshGate = deferred()

    const promises = Array.from({ length: 5 }, () => service.get('/biz'))
    refreshGate.resolve('new-token')
    const results = await Promise.all(promises)

    // 5 个调用方各自的重放全部成功（顺序不耦合断言，只认结果集合）
    expect(results.map(r => r.data).sort()).toEqual([
      'payload#10',
      'payload#6',
      'payload#7',
      'payload#8',
      'payload#9',
    ])
    expect(refreshTokenCalls).toBe(1)
    expect(biz.getCalls()).toBe(10)
    expect(dialogConfirm).not.toHaveBeenCalled()
  })

  it('场景 4（矩阵#5）：刷新期间新进来的请求入队，刷新完成后一并重放', async () => {
    const biz = bizRoute(2)
    const service = createService({ '/biz': biz.handler() })
    refreshGate = deferred()

    const first = service.get('/biz')
    const second = service.get('/biz')
    // 放行刷新：两个过期请求（含刷新期间发起的第二个）一起重放
    refreshGate.resolve('new-token')

    const [r1, r2] = await Promise.all([first, second])

    // 两个请求都重放成功（"谁抢到锁谁当 current"属微任务调度细节，断言不耦合顺序）
    expect([r1.data, r2.data].sort()).toEqual(['payload#3', 'payload#4'])
    expect(refreshTokenCalls).toBe(1)
    expect(lastAuthByEndpoint['/biz']).toBe('Bearer new-token')
  })

  it('场景 5（矩阵#2）：刷新成功后的并发新请求直接用新 token，不再触发刷新', async () => {
    const biz = bizRoute(1)
    const service = createService({ '/biz': biz.handler() })

    await service.get('/biz')
    expect(refreshTokenCalls).toBe(1)

    await service.get('/biz')
    expect(refreshTokenCalls).toBe(1)
    expect(lastAuthByEndpoint['/biz']).toBe('Bearer new-token')
  })

  it('场景 6（矩阵#3）：刷新接口自身失败 → 队列全部按原始错误拒绝 → 回退弹窗登出，无死循环', async () => {
    const biz = bizRoute(1)
    const service = createService({ '/biz': biz.handler() })
    refreshShouldFail = true

    const pending = service.get('/biz')
    // 兜底路径走弹窗时 message 为 false（handleAuthExpired 的返回值），与无刷新时代的错误形状一致
    await expect(pending).rejects.toMatchObject({ code: 401 })

    // 兜底弹窗恰好一次（isConfirming 锁），确认后登出
    expect(dialogConfirm).toHaveBeenCalledTimes(1)
    dialogConfirm.mock.calls.forEach(([options]) => (options as { confirm?: () => void }).confirm?.())
    expect(logout).toHaveBeenCalledTimes(1)
    expect(refreshTokenCalls).toBe(1)
  })

  it('场景 7（矩阵#3 续）：刷新接口自身 HTTP 401 → skipAuthRefresh 拦截，不再二次刷新，直接兜底', async () => {
    // 刷新处理器走真实 HTTP：/auth/refresh/token 端点也返回 401（模拟 refresh token 同样过期）
    const service = createService({
      '/biz': () => ({ data: { code: 401, message: 'token 已过期', data: null } }),
      '/auth/refresh': (config) => {
        lastAuthByEndpoint['/auth/refresh'] = String(config.headers?.Authorization ?? '')
        return { status: 401, data: 'Unauthorized' }
      },
    })
    setupHttpAuth({
      getAccessToken: () => currentToken,
      logout: () => logout(),
      // 与生产 api.refreshToken 同款契约：带 skipAuthRefresh 标记防自触发死循环
      refreshToken: async () => {
        refreshTokenCalls++
        const res = await service.get('/auth/refresh/token', { skipAuthRefresh: true })
        currentToken = String(res.data)
        return currentToken
      },
    })

    await expect(service.get('/biz')).rejects.toMatchObject({ code: 401 })

    // 刷新被调用一次；其 401 未再触发刷新（skipAuthRefresh 生效），最终回退弹窗
    expect(refreshTokenCalls).toBe(1)
    expect(dialogConfirm).toHaveBeenCalledTimes(1)
    releaseDialogLock()
  })

  it('场景 8（矩阵#4）：needToken:false 的请求（登录）401 → 不触发刷新，直接走原错误处理', async () => {
    let loginCalls = 0
    const service = createService({
      '/auth/login': (config) => {
        loginCalls++
        lastAuthByEndpoint['/auth/login'] = String(config.headers?.Authorization ?? 'none')
        return { data: { code: 401, message: '账号或密码错误', data: null } }
      },
    })

    await expect(service.post('/auth/login', { username: 'u' }, { needToken: false }))
      .rejects
      .toMatchObject({ code: 401 })

    expect(refreshTokenCalls).toBe(0)
    expect(loginCalls).toBe(1)
    expect(dialogConfirm).toHaveBeenCalledTimes(1)
    releaseDialogLock()
  })

  it('场景 9：未注入 refreshToken 能力时退化为旧行为——直接弹窗登出，不发刷新', async () => {
    setupHttpAuth({
      getAccessToken: () => currentToken,
      logout: () => logout(),
    })
    const biz = bizRoute(1)
    const service = createService({ '/biz': biz.handler() })

    await expect(service.get('/biz')).rejects.toMatchObject({ code: 401 })

    expect(biz.getCalls()).toBe(1)
    expect(dialogConfirm).toHaveBeenCalledTimes(1)
    releaseDialogLock()
  })
})
