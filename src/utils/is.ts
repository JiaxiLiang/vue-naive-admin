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

export function isFunction<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown>(val: unknown): val is T {
  return typeof val === 'function'
}

export function isNullOrUndef(val: unknown): val is null | undefined {
  return isNull(val) || isUndef(val)
}

export function isNullOrWhitespace(val: unknown): val is null | undefined | '' {
  return isNullOrUndef(val) || isWhitespace(val)
}

/**
 * 是否为外部链接。入参放宽为可空：菜单项的 originPath/path 在部分调用点可能缺省，
 * 此时与空串同样返回 false（正则不命中）
 */
export function isExternal(path: string | null | undefined): boolean {
  return /^https?:|mailto:|tel:/.test(path ?? '')
}
