const toString = Object.prototype.toString

/** 基于 toString tag 判断 val 是否为指定内部类型（如 'Object'、'String'），其余谓词的公共底座 */
export function is(val: unknown, type: string): boolean {
  return toString.call(val) === `[object ${type}]`
}

/** 是否已定义（非 undefined） */
export function isDef<T = unknown>(val: T | undefined): val is T {
  return typeof val !== 'undefined'
}

/** 是否为 undefined */
export function isUndef(val: unknown): val is undefined {
  return typeof val === 'undefined'
}

/** 是否为 null（不含 undefined） */
export function isNull(val: unknown): val is null {
  return val === null
}

/** 是否为空字符串 */
export function isWhitespace(val: unknown): val is '' {
  return val === ''
}

/** 是否为普通对象（排除 null） */
export function isObject<T extends object = Record<string, unknown>>(val: unknown): val is T {
  return !isNull(val) && is(val, 'Object')
}

/** 是否为数组（!!val 收口为布尔：类型谓词必须返回 boolean，且无调用方依赖"真值时返回原数组"的旧语义） */
export function isArray<T = unknown>(val: unknown): val is T[] {
  return !!val && Array.isArray(val)
}

/** 是否为字符串 */
export function isString(val: unknown): val is string {
  return is(val, 'String')
}

/** 是否为数字 */
export function isNumber(val: unknown): val is number {
  return is(val, 'Number')
}

/** 是否为布尔值 */
export function isBoolean(val: unknown): val is boolean {
  return is(val, 'Boolean')
}

/** 是否为 Date 实例 */
export function isDate(val: unknown): val is Date {
  return is(val, 'Date')
}

/** 是否为正则对象 */
export function isRegExp(val: unknown): val is RegExp {
  return is(val, 'RegExp')
}

/** 是否为函数 */
export function isFunction<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown>(val: unknown): val is T {
  return typeof val === 'function'
}

/**
 * 是否为 Promise 或 thenable（带 then/catch 的对象），两种判定取并集。
 * 不能写成"tag 是 Promise 且是普通对象"的交集——两种 toString tag 互斥，交集恒为 false（原实现缺陷）
 */
export function isPromise<T = unknown>(val: unknown): val is Promise<T> {
  return is(val, 'Promise') || (isObject(val) && isFunction(val.then) && isFunction(val.catch))
}

/** 是否为 DOM 元素 */
export function isElement(val: unknown): val is Element {
  return isObject(val) && !!val.tagName
}

/** 是否为 Window 对象（SSR 环境恒为 false） */
export function isWindow(val: unknown): val is Window {
  return typeof window !== 'undefined' && isDef(window) && is(val, 'Window')
}

/** 是否为 null 或 undefined */
export function isNullOrUndef(val: unknown): val is null | undefined {
  return isNull(val) || isUndef(val)
}

/** 是否为 null、undefined 或空字符串 */
export function isNullOrWhitespace(val: unknown): val is null | undefined | '' {
  return isNullOrUndef(val) || isWhitespace(val)
}

/** 是否为空值：空数组 / 空字符串 / 空对象 / 空 Map / 空 Set；其余类型一律视为非空 */
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
 * 类似 SQL 的 IFNULL：val 为 null/undefined/空串时返回备用值 def，否则原样返回
 * @param val 待判断的值
 * @param def 备用值
 */
export function ifNull<T extends number | boolean | string>(val: T | null | undefined | '', def: T | '' = ''): T | '' {
  return isNullOrWhitespace(val) ? def : val
}

/** 是否为合法的 http/https URL */
export function isUrl(path: string): boolean {
  const reg = /^https?:\/\/[-\w+&@#/%?=~|!:,.;]+[-\w+&@#/%=~|]$/
  return reg.test(path)
}

/** 是否为外部链接（http/https/mailto/tel 开头）；入参放宽可空，缺省与空串同样返回 false */
export function isExternal(path: string | null | undefined): boolean {
  return /^https?:|mailto:|tel:/.test(path ?? '')
}

/** 服务端渲染环境判断（本项目为纯前端 SPA，恒为 false；保留供未来 SSR/同构复用） */
export const isServer: boolean = typeof window === 'undefined'

/** 客户端环境常量，与 isServer 互补 */
export const isClient: boolean = !isServer
