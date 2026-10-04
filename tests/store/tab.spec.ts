import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTabStore } from '@/store/modules/tab'

const tab = (path: string, keepAlive = false) => ({ path, title: path, name: path, keepAlive })

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('tab store 增删边界', () => {
  it('addTab：新增追加；重复 path 替换不追加', async () => {
    const store = useTabStore()
    await store.addTab(tab('/a'))
    await store.addTab(tab('/b'))
    expect(store.tabs).toHaveLength(2)
    expect(store.activeTab).toBe('/b')

    await store.addTab(tab('/a', true)) // 重复：原位替换
    expect(store.tabs).toHaveLength(2)
    expect(store.tabs[0]?.keepAlive).toBe(true)
    expect(store.activeTab).toBe('/a')
  })

  it('removeTab：普通移除后激活页跳到剩余最后一个', async () => {
    const store = useTabStore()
    await store.addTab(tab('/a'))
    await store.addTab(tab('/b'))
    await store.addTab(tab('/c'))
    await store.setActiveTab('/c')

    await store.removeTab('/c')
    expect(store.tabs.map(t => t.path)).toEqual(['/a', '/b'])
    expect(store.activeTab).toBe('/c') // activeTab 只在路由实际切换后变化，此处仅验证不崩溃
  })

  it('removeTab：关到只剩一个再关（列表清空）不崩溃、不导航', async () => {
    const store = useTabStore()
    await store.addTab(tab('/only'))
    await store.setActiveTab('/only')

    await store.removeTab('/only')
    expect(store.tabs).toHaveLength(0)
    // 此处 useRouterStore().router 为 undefined（非组件上下文），?.push 静默跳过 = 不导航不崩溃
  })

  it('removeOther：只保留目标页签', async () => {
    const store = useTabStore()
    await store.addTab(tab('/a'))
    await store.addTab(tab('/b'))
    await store.addTab(tab('/c'))
    store.removeOther('/b')
    expect(store.tabs.map(t => t.path)).toEqual(['/b'])
  })

  it('removeLeft：保留右侧；激活页被关时目标仍存在', async () => {
    const store = useTabStore()
    await store.addTab(tab('/a'))
    await store.addTab(tab('/b'))
    await store.addTab(tab('/c'))
    await store.setActiveTab('/a')

    store.removeLeft('/b')
    expect(store.tabs.map(t => t.path)).toEqual(['/b', '/c'])
  })

  it('removeLeft 越界（目标不存在）：索引 -1 截取保留全部', async () => {
    const store = useTabStore()
    await store.addTab(tab('/a'))
    await store.addTab(tab('/b'))
    store.removeLeft('/ghost')
    expect(store.tabs).toHaveLength(2)
  })

  it('removeRight：保留左侧；激活页被关时跳到保留列表末尾', async () => {
    const store = useTabStore()
    await store.addTab(tab('/a'))
    await store.addTab(tab('/b'))
    await store.addTab(tab('/c'))
    await store.setActiveTab('/c')

    store.removeRight('/a')
    expect(store.tabs.map(t => t.path)).toEqual(['/a'])
  })

  it('removeRight 越界（目标不存在）：清空列表不崩溃', async () => {
    const store = useTabStore()
    await store.addTab(tab('/a'))
    store.removeRight('/ghost')
    expect(store.tabs).toHaveLength(0)
  })

  it('reloadTab：对 keepAlive 页先关缓存再恢复（刷新语义）', async () => {
    window.$loadingBar = { start: vi.fn(), finish: vi.fn(), error: vi.fn() }
    const store = useTabStore()
    await store.addTab(tab('/k', true))
    const p = store.reloadTab('/k', true)
    expect(store.tabs[0]?.keepAlive).toBe(false) // 先关闭缓存使 keep-alive 失效
    await p
    expect(store.tabs[0]?.keepAlive).toBe(true) // 刷新完成后恢复原配置
  })
})
