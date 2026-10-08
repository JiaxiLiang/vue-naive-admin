import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'

/**
 * 格式化日期时间
 * @param time 待格式化的时间（缺省按当前时间，dayjs(undefined) 即 now）
 * @param format 输出格式
 * @returns 格式化后的时间字符串
 */
export function formatDateTime(time: ConfigType = undefined, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(time).format(format)
}

/** 只保留日期部分的窄格式（formatDateTime 的包装） */
export function formatDate(date: ConfigType = undefined, format = 'YYYY-MM-DD'): string {
  return formatDateTime(date, format)
}

/**
 * 节流：wait 毫秒内最多执行一次，高频事件（resize/scroll）降频专用
 * @param fn 需要节流的函数
 * @param wait 间隔毫秒数
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(fn: T, wait: number): (...args: Parameters<T>) => void {
  let context: unknown
  let args: Parameters<T>
  let previous = 0

  return function (this: unknown, ...argArr: Parameters<T>) {
    const now = Date.now()
    context = this
    args = argArr
    // 距上次执行超过 wait 才放行本次调用
    if (now - previous > wait) {
      fn.apply(context, args)
      previous = now
    }
  }
}

/**
 * 防抖：停止触发 wait 毫秒后才真正执行；immediate 为 true 时改为首次立即执行，
 * 并在 wait 毫秒冷却期内不再触发（搜索联想、按钮防连点）
 * @param method 需要防抖的函数
 * @param wait 间隔毫秒数
 * @param immediate 是否立即执行
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(method: T, wait: number, immediate?: boolean): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    const context = this
    if (timeout) {
      clearTimeout(timeout)
    }
    // 立即执行需同时满足：immediate 开启且当前不在冷却期（timeout 已置空）
    if (immediate) {
      // 立即执行后开启 wait 毫秒冷却计时，期间再次触发 callNow 恒为 false，不会重复执行
      const callNow = !timeout
      timeout = setTimeout(() => {
        timeout = null
      }, wait)
      if (callNow) {
        method.apply(context, args)
      }
    }
    else {
      // 尾缘触发：每次触发都重新计时，停下来之后的 wait 毫秒才执行
      timeout = setTimeout(() => {
        method.apply(context, args)
      }, wait)
    }
  }
}

/**
 * 监听元素尺寸变化
 * @param el 监听的元素
 * @param cb 尺寸变化回调（收到 contentRect）
 * @returns ResizeObserver 实例（调用方在适当时机自行 disconnect）
 */
export function useResize(el: HTMLElement, cb: (rect: DOMRectReadOnly) => void): ResizeObserver {
  const observer = new ResizeObserver((entries) => {
    // 回调每次触发至少携带一个 entry（运行时事实，编译器不可知），非空收口
    cb(entries[0]!.contentRect)
  })
  observer.observe(el)
  return observer
}

/** 等待指定毫秒的空 Promise（演示/测试中制造时间间隔用） */
export function sleep(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time))
}
