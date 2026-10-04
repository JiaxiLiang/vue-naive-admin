import { describe, expect, it } from 'vitest'
import {
  ifNull,
  isArray,
  isBoolean,
  isClient,
  isDate,
  isDef,
  isElement,
  isEmpty,
  isExternal,
  isFunction,
  isNull,
  isNullOrUndef,
  isNullOrWhitespace,
  isNumber,
  isObject,
  isPromise,
  isRegExp,
  isServer,
  isString,
  isUndef,
  isUrl,
  isWhitespace,
  isWindow,
} from '@/utils/is'

describe('is 类型谓词（正例 + 反例）', () => {
  it('isObject：纯对象为真，数组/null/原始值为假', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
    expect(isObject([])).toBe(false)
    expect(isObject(null)).toBe(false)
    expect(isObject('str')).toBe(false)
  })

  it('isArray：数组为真，伪数组与对象为假', () => {
    expect(isArray([1, 2])).toBe(true)
    expect(isArray(Array.from({ length: 3 }))).toBe(true)
    expect(isArray({ length: 3 })).toBe(false)
    expect(isArray('abc')).toBe(false)
    expect(isArray(null)).toBe(false)
  })

  it('isString：字符串为真，其余为假', () => {
    expect(isString('')).toBe(true)
    expect(isString(123)).toBe(false)
  })

  it('isFunction：函数为真，其余为假', () => {
    expect(isFunction(() => {})).toBe(true)
    expect(isFunction({})).toBe(false)
  })

  it('isNull / isUndef / isDef / isWhitespace', () => {
    expect(isNull(null)).toBe(true)
    expect(isNull(undefined)).toBe(false)
    expect(isUndef(undefined)).toBe(true)
    expect(isUndef(null)).toBe(false)
    expect(isDef(0)).toBe(true)
    expect(isDef(undefined)).toBe(false)
    expect(isWhitespace('')).toBe(true)
    expect(isWhitespace(' ')).toBe(false)
  })

  it('isNullOrUndef / isNullOrWhitespace', () => {
    expect(isNullOrUndef(null)).toBe(true)
    expect(isNullOrUndef(undefined)).toBe(true)
    expect(isNullOrUndef('')).toBe(false)
    expect(isNullOrWhitespace('')).toBe(true)
    expect(isNullOrWhitespace(undefined)).toBe(true)
    expect(isNullOrWhitespace('a')).toBe(false)
  })

  it('isExternal：http/https/mailto/tel 命中，相对路径与空值不命中', () => {
    expect(isExternal('https://isme.top')).toBe(true)
    expect(isExternal('http://a.com')).toBe(true)
    expect(isExternal('mailto:a@b.c')).toBe(true)
    expect(isExternal('tel:10086')).toBe(true)
    expect(isExternal('/user/list')).toBe(false)
    expect(isExternal('iframe/user')).toBe(false)
    expect(isExternal(undefined)).toBe(false)
    expect(isExternal(null)).toBe(false)
  })

  it('isNumber / isBoolean：原始类型判断正反例', () => {
    expect(isNumber(123)).toBe(true)
    expect(isNumber('123')).toBe(false)
    expect(isNumber(null)).toBe(false)
    expect(isBoolean(true)).toBe(true)
    expect(isBoolean(false)).toBe(true)
    expect(isBoolean(0)).toBe(false)
    expect(isBoolean('false')).toBe(false)
  })

  it('isDate / isRegExp：对象子类型判断正反例', () => {
    expect(isDate(new Date())).toBe(true)
    expect(isDate('2024-01-01')).toBe(false)
    expect(isDate(1700000000000)).toBe(false)
    expect(isRegExp(/abc/)).toBe(true)
    expect(isRegExp(/abc/gi)).toBe(true)
    expect(isRegExp('/abc/')).toBe(false)
  })

  it('isPromise：真 Promise 与 thenable（有 then/catch 方法）为真，其余为假', () => {
    expect(isPromise(Promise.resolve(1))).toBe(true)
    expect(isPromise(new Promise(() => {}))).toBe(true)
    expect(isPromise({ then: () => {}, catch: () => {} })).toBe(true)
    expect(isPromise({ then: '不是函数' })).toBe(false)
    expect(isPromise({})).toBe(false)
    expect(isPromise(null)).toBe(false)
  })

  it('isElement：带 tagName 的对象为真，其余为假', () => {
    expect(isElement({ tagName: 'DIV' })).toBe(true)
    expect(isElement({})).toBe(false)
    expect(isElement('<div>')).toBe(false)
    expect(isElement(null)).toBe(false)
  })

  it('isWindow：toString tag 为 Window 的对象为真，其余为假', () => {
    // 以 toString tag 判定（happy-dom 的 window 实例不暴露 '[object Window]' tag，故用字面量构造正例）
    expect(isWindow({ [Symbol.toStringTag]: 'Window' })).toBe(true)
    expect(isWindow({})).toBe(false)
    expect(isWindow('window')).toBe(false)
  })

  it('isEmpty：空数组/空串/空对象/空Map/空Set 为真，非空与 null/原始值为假', () => {
    expect(isEmpty([])).toBe(true)
    expect(isEmpty('')).toBe(true)
    expect(isEmpty({})).toBe(true)
    expect(isEmpty(new Map())).toBe(true)
    expect(isEmpty(new Set())).toBe(true)

    expect(isEmpty([1])).toBe(false)
    expect(isEmpty('a')).toBe(false)
    expect(isEmpty({ a: 1 })).toBe(false)
    expect(isEmpty(new Map([[1, 'one']]))).toBe(false)
    expect(isEmpty(new Set([1]))).toBe(false)
    expect(isEmpty(null)).toBe(false)
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(false)).toBe(false)
  })

  it('ifNull：null/undefined/空串走默认值，0 与 false 不走（仅空值语义）', () => {
    expect(ifNull(null, '默认')).toBe('默认')
    expect(ifNull(undefined, '默认')).toBe('默认')
    expect(ifNull('', '默认')).toBe('默认')
    expect(ifNull('有值', '默认')).toBe('有值')
    expect(ifNull(0, 5)).toBe(0) // 0 是合法值，不触发兜底
    expect(ifNull(false, true)).toBe(false)
  })

  it('isUrl：合法 http(s) URL 命中，其他协议与普通文本不命中', () => {
    expect(isUrl('https://isme.top')).toBe(true)
    expect(isUrl('http://a.com:8080/path?q=1')).toBe(true)
    expect(isUrl('ftp://a.com')).toBe(false)
    expect(isUrl('isme.top')).toBe(false)
    expect(isUrl('不是链接')).toBe(false)
  })

  it('isServer / isClient：浏览器测试环境下恒为 false/true', () => {
    expect(isServer).toBe(false)
    expect(isClient).toBe(true)
  })
})
