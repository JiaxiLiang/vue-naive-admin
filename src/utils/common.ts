import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'

/**
 * @param time 待格式化的时间（空值时按当前时间兜底，dayjs(undefined) 即 now）
 * @param format 格式
 * @returns 格式化后的时间字符串
 */
export function formatDateTime(time: ConfigType = undefined, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(time).format(format)
}

/**
 * @param fn 需要节流的函数
 * @param wait 间隔时间（毫秒）
 * @returns 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(fn: T, wait: number): (...args: Parameters<T>) => void {
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
 * @param time 毫秒数
 * @returns 睡一会儿，让子弹暂停一下
 */
export function sleep(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time))
}
