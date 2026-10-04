import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSessionStorage, lStorage, sStorage } from '@/utils/storage'
import { createStorage } from '@/utils/storage/storage'

describe('storage 封装', () => {
  let store: ReturnType<typeof createStorage>

  beforeEach(() => {
    sessionStorage.clear()
    store = createStorage({ prefixKey: 'test_' })
  })

  it('set/get 往返一致，key 带前缀', () => {
    store.set('user', { id: 1 })
    expect(sessionStorage.getItem('test_user')).not.toBeNull()
    expect(store.get<{ id: number }>('user')).toEqual({ id: 1 })
  })

  it('get 无默认值时未存储返回 undefined，有默认值返回默认值（函数重载）', () => {
    expect(store.get('missing')).toBeUndefined()
    expect(store.get('missing', 'fallback')).toBe('fallback')
  })

  it('get 默认值分支：显式默认对象', () => {
    const def = { a: 1 }
    expect(store.get('missing', def)).toBe(def)
  })

  it('过期键读后即清除并走默认值分支', () => {
    vi.useFakeTimers()
    store.set('temp', 'v', 10) // 10 秒过期
    expect(store.get('temp')).toBe('v')
    vi.advanceTimersByTime(10 * 1000 + 1)
    expect(store.get('temp', 'expired')).toBe('expired')
    expect(sessionStorage.getItem('test_temp')).toBeNull() // 读后即清
    vi.useRealTimers()
  })

  it('损坏的 JSON 视同未存储：清除并走默认值分支', () => {
    sessionStorage.setItem('test_bad', '{broken json')
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(store.get('bad', 'default')).toBe('default')
    expect(sessionStorage.getItem('test_bad')).toBeNull()
    warn.mockRestore()
  })

  it('形状不符的 JSON（裸数字）走默认值分支且不崩溃', () => {
    sessionStorage.setItem('test_num', '5')
    expect(store.get('num', 'd')).toBe('d')
  })

  it('remove/clear', () => {
    store.set('a', 1)
    store.set('b', 2)
    store.remove('a')
    expect(store.get('a')).toBeUndefined()
    expect(store.get('b')).toBe(2)
    store.clear()
    expect(store.get('b')).toBeUndefined()
  })
})

describe('storage 实例（预置底座：lStorage / sStorage / createSessionStorage）', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('lStorage 挂在 localStorage，key 带 vue-naive-admin_ 前缀', () => {
    lStorage.set('user', { id: 1 })
    expect(localStorage.getItem('vue-naive-admin_user')).not.toBeNull()
    expect(lStorage.get<{ id: number }>('user')).toEqual({ id: 1 })
    lStorage.remove('user')
    expect(localStorage.getItem('vue-naive-admin_user')).toBeNull()
  })

  it('sStorage 挂在 sessionStorage，与 lStorage 互不串台', () => {
    sStorage.set('session', 's值')
    lStorage.set('session', 'l值')
    expect(sStorage.get('session')).toBe('s值')
    expect(lStorage.get('session')).toBe('l值')
    expect(sessionStorage.getItem('vue-naive-admin_session')).toContain('s值')
  })

  it('createSessionStorage 支持自定义前缀', () => {
    const custom = createSessionStorage({ prefixKey: 'custom_' })
    custom.set('k', 123)
    expect(sessionStorage.getItem('custom_k')).not.toBeNull()
    expect(custom.get<number>('k')).toBe(123)
  })

  it('sStorage 的过期键走默认值分支（与底层封装一致）', () => {
    vi.useFakeTimers()
    sStorage.set('temp', 'v', 5)
    vi.advanceTimersByTime(5 * 1000 + 1)
    expect(sStorage.get('temp', '过期')).toBe('过期')
    expect(sessionStorage.getItem('vue-naive-admin_temp')).toBeNull()
    vi.useRealTimers()
  })
})
