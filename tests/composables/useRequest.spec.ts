import type { UseRequestOptions } from '@/composables/useRequest'
import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useRequest } from '@/composables/useRequest'

/** 受控时序的 Promise：手动决定何时兑现（模拟慢响应/慢失败） */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup<T>(fetcher: (signal: AbortSignal) => Promise<T>, options?: UseRequestOptions) {
  const instance = useRequest(fetcher, options)
  return { ...instance }
}

describe('useRequest 异步请求标准件', () => {
  it('成功：run 写入 data 并返回结果，loading 置位后复位', async () => {
    const { data, loading, run } = setup(async () => 'ok')

    const pending = run()
    expect(loading.value).toBe(true)
    await expect(pending).resolves.toBe('ok')
    expect(data.value).toBe('ok')
    expect(loading.value).toBe(false)
  })

  it('失败：error 有值、loading 复位、旧 data 不被清掉', async () => {
    const { data, error, loading, run } = setup(async () => {
      throw new Error('boom')
    })
    data.value = 'kept'

    await run()

    expect(error.value).toEqual(new Error('boom'))
    expect(loading.value).toBe(false)
    expect(data.value).toBe('kept')
  })

  it('竞态丢弃：快速连发两次 run，只有最后一次的结果生效', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const seen: Array<AbortSignal> = []
    const { data, error, run } = setup((signal) => {
      seen.push(signal)
      return seen.length === 1 ? first.promise : second.promise
    })

    const p1 = run()
    const p2 = run()
    first.resolve('slow-old')
    second.resolve('fresh')

    await Promise.all([p1, p2])
    // 旧响应先到也不改写状态：data 只采纳第二次的结果，p1 静默返回 undefined
    expect(await p1).toBeUndefined()
    expect(data.value).toBe('fresh')
    expect(error.value).toBeUndefined()
    // 默认 abortPrevious：第二次 run 已中止第一个请求的 signal
    expect(seen[0]?.aborted).toBe(true)
    expect(seen[1]?.aborted).toBe(false)
  })

  it('过期响应的失败同样丢弃：旧 run 的错误不覆盖新结果', async () => {
    // 两个 run 各自持有独立的延迟 promise：旧 run 的失败晚于新 run 发起才作数
    const deferreds = [deferred<string>(), deferred<string>()]
    let call = 0
    const { data, error, run } = setup(() => deferreds[call++]!.promise)

    const p1 = run()
    const p2 = run()
    deferreds[0]!.reject(new Error('late failure'))
    deferreds[1]!.resolve('fresh')

    await Promise.all([p1, p2])
    expect(await p1).toBeUndefined()
    expect(error.value).toBeUndefined()
    expect(data.value).toBe('fresh')
  })

  it('abortPrevious: false 时不中止上一个（序号丢弃兜底防竞态）', async () => {
    const seen: Array<AbortSignal> = []
    const { run } = setup((signal) => {
      seen.push(signal)
      return Promise.resolve(seen.length)
    }, { abortPrevious: false })

    await run()
    await run()
    expect(seen[0]?.aborted).toBe(false)
  })

  it('组件卸载：自动中止在途请求', async () => {
    const seen: Array<AbortSignal> = []
    const scope = effectScope()
    let run!: () => Promise<unknown>
    scope.run(() => {
      ({ run } = useRequest((signal) => {
        seen.push(signal)
        return new Promise<string>(() => {})
      }))
    })

    void run()
    scope.stop()
    expect(seen[0]?.aborted).toBe(true)
  })

  it('cancel 手动中止：在途请求以中止收场，loading 复位', async () => {
    // 忠实模拟 axios 的 signal 行为：abort 时请求以 abort 原因 reject
    const { cancel, loading, run } = setup(signal => new Promise<string>((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason))
    }))

    const pending = run()
    cancel()
    await expect(pending).resolves.toBeUndefined()
    expect(loading.value).toBe(false)
  })

  it('fetcher 抛错时 error 记录但不弹窗（错误提示职责在 http 层 needTip）', async () => {
    const messageError = vi.fn()
    window.$message = { error: messageError } as never
    const { error, run } = setup(async () => {
      throw new Error('http already tipped')
    })

    await run()
    expect(error.value).toEqual(new Error('http already tipped'))
    expect(messageError).not.toHaveBeenCalled()
  })
})
