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

// 迁移期调整：原实现为 val && Array.isArray(val)（真值时返回原数组），因类型谓词必须返回
// boolean 收窄为布尔值；全项目无调用方依赖返回原数组，真值语义不变
export function isArray<T = unknown>(val: unknown): val is T[] {
  return !!val && Array.isArray(val)
}

export function isString(val: unknown): val is string {
  return is(val, 'String')
}

// ── 预置类型谓词（2026-10-04 用户决策恢复：为后续功能预留的工具底座，配套单测见 tests/utils/is.spec.ts）──

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

export function isFunction<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown>(val: unknown): val is T {
  return typeof val === 'function'
}

/**
 * 真 Promise（toString tag 为 '[object Promise]'）或 thenable（有 then/catch 方法）。
 * 修正记录：原实现 is(val,'Promise') && isObject(val) 的交集对任何输入都恒为 false
 *（两种 toString tag 互斥），属未被发现的原实现缺陷（此前零调用方）；
 * 2026-10-04 恢复为工具底座时修正为并集语义，行为差异已登记验收报告附录
 */
export function isPromise<T = unknown>(val: unknown): val is Promise<T> {
  return is(val, 'Promise') || (isObject(val) && isFunction(val.then) && isFunction(val.catch))
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
 * @returns 第一个参数为 null | undefined | '' 则返回第二个参数作为备用值，否则返回第一个参数
 */
export function ifNull<T extends number | boolean | string>(val: T | null | undefined | '', def: T | '' = ''): T | '' {
  return isNullOrWhitespace(val) ? def : val
}

export function isUrl(path: string): boolean {
  const reg = /^https?:\/\/[-\w+&@#/%?=~|!:,.;]+[-\w+&@#/%=~|]$/
  return reg.test(path)
}

/**
 * 是否为外部链接。入参放宽为可空：菜单项的 originPath/path 在部分调用点可能缺省，
 * 此时与空串同样返回 false（正则不命中）
 */
export function isExternal(path: string | null | undefined): boolean {
  return /^https?:|mailto:|tel:/.test(path ?? '')
}

/** 服务端渲染环境判断（本项目为纯前端 SPA，恒为 false；保留供未来 SSR/同构复用） */
export const isServer: boolean = typeof window === 'undefined'

export const isClient: boolean = !isServer
