import { describe, expect, it } from 'vitest'
import {
  isArray,
  isDef,
  isExternal,
  isFunction,
  isNull,
  isNullOrUndef,
  isNullOrWhitespace,
  isObject,
  isString,
  isUndef,
  isWhitespace,
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
})
