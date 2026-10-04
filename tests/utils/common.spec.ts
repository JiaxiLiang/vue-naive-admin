import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatDateTime, sleep, throttle } from '@/utils/common'

describe('formatDateTime', () => {
  it('按默认格式格式化时间', () => {
    expect(formatDateTime('2024-01-02 03:04:05')).toBe('2024-01-02 03:04:05')
  })

  it('空值兜底为当前时间（返回合法日期字符串）', () => {
    const result = formatDateTime(undefined)
    expect(result).not.toBe('Invalid Date')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('支持自定义格式', () => {
    expect(formatDateTime('2024-01-02', 'YYYY/MM/DD')).toBe('2024/01/02')
  })
})

describe('throttle 节流', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('首次立即执行，节流窗口内不重复执行', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1) // 首次立即执行

    throttled()
    throttled()
    expect(fn).toHaveBeenCalledTimes(1) // 窗口内被节流

    vi.advanceTimersByTime(101)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2) // 窗口结束后恢复
  })

  it('透传参数', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled('a', 2)
    expect(fn).toHaveBeenCalledWith('a', 2)
  })
})

describe('sleep', () => {
  it('等待指定毫秒后 resolve', async () => {
    vi.useFakeTimers()
    const promise = sleep(50)
    const spy = vi.fn()
    promise.then(spy)
    await vi.advanceTimersByTimeAsync(50)
    expect(spy).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
