import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'

/**
 * @param time 待格式化的时间
 * @param format 格式
 * @returns 格式化后的时间字符串
 *
 */
export function formatDateTime(time: ConfigType = undefined, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(time).format(format)
}

export function formatDate(date: ConfigType = undefined, format = 'YYYY-MM-DD'): string {
  return formatDateTime(date, format)
}

/**
 * @param fn 需要节流的函数
 * @param wait 间隔时间（毫秒）
 * @returns 节流函数
 *
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters<T>) => void {
  let context: unknown
  let args: Parameters<T>
  let previous = 0

  return function (this: unknown, ...argArr: Parameters<T>) {
    const now = Date.now()
    context = this
    args = argArr
    if (now - previous > wait) {
      fn.apply(context, args)
      previous = now
    }
  }
}

/**
 * @param method 需要防抖的函数
 * @param wait 间隔时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(method: T, wait: number, immediate?: boolean): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    const context = this
    if (timeout) {
      clearTimeout(timeout)
    }
    // 立即执行需要两个条件，一是immediate为true，二是timeout未被赋值或被置为null
    if (immediate) {
      /**
       * 如果定时器不存在，则立即执行，并设置一个定时器，wait毫秒后将定时器置为null
       * 这样确保立即执行后wait毫秒内不会被再次触发
       */
      const callNow = !timeout
      timeout = setTimeout(() => {
        timeout = null
      }, wait)
      if (callNow) {
        method.apply(context, args)
      }
    }
    else {
      // 如果immediate为false，则函数wait毫秒后执行
      timeout = setTimeout(() => {
        /**
         * args是一个类数组对象，所以使用fn.apply
         * 也可写作method.call(context, ...args)
         */
        method.apply(context, args)
      }, wait)
    }
  }
}

/**
 * @param time 毫秒数
 * @returns 睡一会儿，让子弹暂停一下
 */
export function sleep(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time))
}

/**
 * @param el 监听的元素
 * @param cb 尺寸变化回调
 * @returns ResizeObserver 实例
 */
export function useResize(el: HTMLElement, cb: (rect: DOMRectReadOnly) => void): ResizeObserver {
  const observer = new ResizeObserver((entries) => {
    cb(entries[0].contentRect)
  })
  observer.observe(el)
  return observer
}
