import type { AxiosAdapter, AxiosResponse } from 'axios'
import type { WrappedDialog, WrappedMessage } from '@/types/global'
import type { RequestConfig } from '@/utils/http'
import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAxios, setupHttpAuth } from '@/utils/http'
import { resolveResError } from '@/utils/http/helpers'

function stubMessage(): WrappedMessage {
  // 全局桩：只含被消费的方法（T4 约定的 mock 边界）
  return {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    destroy: vi.fn(),
  }
}

function stubDialog(): WrappedDialog {
  return { confirm: vi.fn() } as unknown as WrappedDialog
}

function jsonResponse(): AxiosResponse['headers'] {
  return { 'content-type': 'application/json' }
}

/** 用自定义 adapter 构造可控实例（真实经过拦截器链） */
function createTestInstance(response: { status?: number, data?: unknown, headers?: Record<string, string> }) {
  return createAxios({
    adapter: (async (config) => {
      const status = response.status ?? 200
      const res: AxiosResponse = {
        data: response.data,
        status,
        statusText: 'OK',
        headers: response.headers ?? jsonResponse(),
        config,
      }
      if (status >= 400) {
        throw new AxiosError('Request failed', status === 401 ? 'ERR_BAD_REQUEST' : 'ERR_BAD_RESPONSE', config, {}, res)
      }
      return res
    }) as AxiosAdapter,
  } satisfies RequestConfig)
}

describe('http 拦截器', () => {
  let logout: ReturnType<typeof vi.fn>

  beforeEach(() => {
    logout = vi.fn()
    setupHttpAuth({ getAccessToken: () => 'token-abc', logout: () => logout() })
    window.$message = stubMessage()
    window.$dialog = stubDialog()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('业务码成功：放行响应体（HttpClient 泛型传到 res.data）', async () => {
    const instance = createTestInstance({ data: { code: 200, message: 'ok', data: { id: 1 } } })
    const res = await instance.get<{ id: number }>('/x')
    expect(res.data).toEqual({ id: 1 })
    expect(window.$message.error).not.toHaveBeenCalled()
  })

  it('业务码失败（code!==200）：reject 出 RequestError 形状并弹全局提示', async () => {
    const instance = createTestInstance({ data: { code: 10003, message: '验证码错误', data: null } })
    await expect(instance.get('/x')).rejects.toMatchObject({ code: 10003, message: '验证码错误' })
    expect(window.$message.error).toHaveBeenCalledWith('验证码错误')
  })

  it('needTip: false 时不弹全局提示', async () => {
    const instance = createTestInstance({ data: { code: 10003, message: '静默失败', data: null } })
    await expect(instance.get('/x', { needTip: false })).rejects.toMatchObject({ code: 10003 })
    expect(window.$message.error).not.toHaveBeenCalled()
  })

  it('hTTP 500：reject 且提示服务器异常', async () => {
    const instance = createTestInstance({ status: 500, data: { message: 'boom' } })
    await expect(instance.get('/x')).rejects.toMatchObject({ code: 500 })
    expect(window.$message.error).toHaveBeenCalledWith('服务器发生异常')
  })

  it('hTTP 401：不直接提示，弹出"重新登录"确认框；确认后触发注入的 logout', async () => {
    const instance = createTestInstance({ status: 401, data: null })
    await expect(instance.get('/x')).rejects.toBeTruthy()
    expect(window.$dialog.confirm).toHaveBeenCalledTimes(1)
    const options = (window.$dialog.confirm as ReturnType<typeof vi.fn>).mock.calls[0][0] as { confirm?: () => void }
    options.confirm?.()
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('断网（无 response）：reject 且 code 为 axios 字符串错误码', async () => {
    const instance = createAxios({
      adapter: (async () => {
        throw new AxiosError('Network Error', 'ERR_NETWORK')
      }) as AxiosAdapter,
    } satisfies RequestConfig)
    await expect(instance.get('/x')).rejects.toMatchObject({ code: 'ERR_NETWORK' })
  })
})

describe('请求头 token 装配', () => {
  it('默认携带 Bearer token；needToken: false 时不带', async () => {
    setupHttpAuth({ getAccessToken: () => 'token-abc', logout: () => {} })
    const headersSeen: Array<string | undefined> = []
    const instance = createAxios({
      adapter: (async (config) => {
        headersSeen.push(config.headers?.Authorization as string | undefined)
        return { data: { code: 200, message: 'ok', data: null }, status: 200, statusText: 'OK', headers: jsonResponse(), config }
      }) as AxiosAdapter,
    } satisfies RequestConfig)
    await instance.get('/a')
    await instance.post('/login', {}, { needToken: false })
    expect(headersSeen[0]).toBe('Bearer token-abc')
    expect(headersSeen[1]).toBeUndefined()
  })
})

describe('resolveResError', () => {
  beforeEach(() => {
    window.$message = stubMessage()
    window.$dialog = stubDialog()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('401 走会话过期确认；needTip=false 时不弹', () => {
    expect(resolveResError(401, undefined, false)).toBe(false)
    expect(window.$dialog.confirm).not.toHaveBeenCalled()
    resolveResError(401)
    expect(window.$dialog.confirm).toHaveBeenCalledTimes(1)
  })

  it('403/404/500 的固定文案 + needTip 开关', () => {
    expect(resolveResError(403, undefined, false)).toBe('请求被拒绝')
    expect(resolveResError(404, undefined, false)).toBe('请求资源或接口不存在')
    expect(resolveResError(500, undefined, false)).toBe('服务器发生异常')
    resolveResError(403)
    expect(window.$message.error).toHaveBeenCalledWith('请求被拒绝')
  })

  it('未知错误码回显 message 或错误码', () => {
    expect(resolveResError(99999, '自定义错误', false)).toBe('自定义错误')
    expect(resolveResError(99999, undefined, false)).toBe('【99999】: 未知异常!')
    expect(resolveResError(undefined, undefined, false)).toBe('【undefined】: 未知异常!')
  })
})
