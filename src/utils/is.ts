const toString = Object.prototype.toString

export function is(val: unknown, type: string): boolean {
  return toString.call(val) === `[object ${type}]`
}

export function isDef<T = unknown>(val: T | undefined): val is T {
  return typeof val !== 'undefined'
}

export function isUndef(val: unknown): val is undefined {
  return typeof val === 'undefined'
}

export function isNull(val: unknown): val is null {
  return val === null
}

export function isWhitespace(val: unknown): val is '' {
  return val === ''
}

export function isObject<T extends object = Record<string, unknown>>(val: unknown): val is T {
  return !isNull(val) && is(val, 'Object')
}

// 原实现为 val && Array.isArray(val)（真值时返回原数组），这里统一收窄为布尔值，真值语义不变
export function isArray<T = unknown>(val: unknown): val is T[] {
  return !!val && Array.isArray(val)
}

export function isString(val: unknown): val is string {
  return is(val, 'String')
}

export function isNumber(val: unknown): val is number {
  return is(val, 'Number')
}

export function isBoolean(val: unknown): val is boolean {
  return is(val, 'Boolean')
}

export function isDate(val: unknown): val is Date {
  return is(val, 'Date')
}

export function isRegExp(val: unknown): val is RegExp {
  return is(val, 'RegExp')
}

export function isFunction<T extends (...args: any[]) => any = (...args: any[]) => any>(val: unknown): val is T {
  return typeof val === 'function'
}

export function isPromise<T = any>(val: unknown): val is Promise<T> {
  return is(val, 'Promise') && isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

export function isElement(val: unknown): val is Element {
  return isObject(val) && !!val.tagName
}

export function isWindow(val: unknown): val is Window {
  return typeof window !== 'undefined' && isDef(window) && is(val, 'Window')
}

export function isNullOrUndef(val: unknown): val is null | undefined {
  return isNull(val) || isUndef(val)
}

export function isNullOrWhitespace(val: unknown): val is null | undefined | '' {
  return isNullOrUndef(val) || isWhitespace(val)
}

/** 空数组 | 空字符串 | 空对象 | 空Map | 空Set */
export function isEmpty(val: unknown): boolean {
  if (isArray(val) || isString(val)) {
    return val.length === 0
  }

  if (val instanceof Map || val instanceof Set) {
    return val.size === 0
  }

  if (isObject(val)) {
    return Object.keys(val).length === 0
  }

  return false
}

/**
 * 类似mysql的IFNULL函数
 *
 * @param val 待判断的值
 * @param def 备用值
 * @returns 第一个参数为null | undefined | '' 则返回第二个参数作为备用值，否则返回第一个参数
 */
export function ifNull<T extends number | boolean | string>(val: T | null | undefined | '', def: T | '' = ''): T | '' {
  return isNullOrWhitespace(val) ? def : val
}

export function isUrl(path: string): boolean {
  const reg = /^https?:\/\/[-\w+&@#/%?=~|!:,.;]+[-\w+&@#/%=~|]$/
  return reg.test(path)
}

/**
 * @param path 待判断的路径
 * @returns 是否是外部链接
 */
export function isExternal(path: string): boolean {
  return /^https?:|mailto:|tel:/.test(path)
}

export const isServer: boolean = typeof window === 'undefined'

export const isClient: boolean = !isServer
