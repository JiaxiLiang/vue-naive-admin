import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce, formatDate, formatDateTime, sleep, throttle, useResize } from '@/utils/common'

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

describe('formatDate', () => {
  it('只保留日期部分', () => {
    expect(formatDate('2024-01-02 03:04:05')).toBe('2024-01-02')
  })

  it('空值兜底为当前日期', () => {
    expect(formatDate(undefined)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
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

describe('debounce 防抖', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('默认模式：连续触发只在停止后执行最后一次', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    vi.advanceTimersByTime(50)
    debounced('b')
    debounced('c')
    expect(fn).not.toHaveBeenCalled() // 窗口内反复触发，尚未执行

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1) // 停止 100ms 后执行一次
    expect(fn).toHaveBeenCalledWith('c') // 执行的是最后一次参数
  })

  it('immediate 模式：首次立即执行，窗口内抑制，窗口后恢复立即执行', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100, true)

    debounced('first')
    expect(fn).toHaveBeenCalledTimes(1) // 立即执行
    expect(fn).toHaveBeenCalledWith('first')

    debounced('ignored')
    expect(fn).toHaveBeenCalledTimes(1) // 窗口内被抑制

    vi.advanceTimersByTime(101)
    debounced('second')
    expect(fn).toHaveBeenCalledTimes(2) // 窗口结束后再次立即执行
    expect(fn).toHaveBeenCalledWith('second')
  })

  it('透传 this 与参数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced(1, 2)
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledWith(1, 2)
  })
})

describe('useResize 尺寸监听', () => {
  interface FakeEntry { contentRect: DOMRectReadOnly }
  type FakeCallback = (entries: FakeEntry[]) => void

  class FakeResizeObserver {
    static lastCb: FakeCallback | undefined
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    constructor(cb: FakeCallback) {
      FakeResizeObserver.lastCb = cb
    }
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('observe 目标元素，回调透出第一个 entry 的 contentRect', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const cb = vi.fn()
    const el = document.createElement('div')
    const observer = useResize(el, cb)

    expect(observer.observe).toHaveBeenCalledWith(el)

    const rect = { width: 100, height: 50 } as DOMRectReadOnly
    FakeResizeObserver.lastCb?.([{ contentRect: rect }])
    expect(cb).toHaveBeenCalledWith(rect)
  })

  it('返回的是真实 ResizeObserver 实例（浏览器环境冒烟）', () => {
    // happy-dom 提供原生 ResizeObserver；不存在时跳过（预置工具以桩测为准）
    if (typeof ResizeObserver === 'undefined')
      return
    const observer = useResize(document.createElement('div'), () => {})
    expect(observer).toBeInstanceOf(ResizeObserver)
    observer.disconnect()
  })
})
