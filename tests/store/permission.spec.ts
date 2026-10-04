import type { PermissionItem } from '@/types/models'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePermissionStore } from '@/store/modules/permission'

function item(partial: Partial<PermissionItem> & Pick<PermissionItem, 'code' | 'name' | 'type'>): PermissionItem {
  return { ...partial }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('permission store：setPermissions → getMenuItem/generateRoute', () => {
  it('只取 MENU 类型生成菜单树，hidden（show=false）节点不进菜单', () => {
    const store = usePermissionStore()
    store.setPermissions([
      item({ code: 'Dir', name: '目录', type: 'DIR' }),
      item({ code: 'MenuA', name: '菜单A', type: 'MENU', order: 2, enable: true, path: '/a', show: true }),
      item({ code: 'MenuHidden', name: '隐藏菜单', type: 'MENU', order: 1, enable: true, path: '/h', show: false }),
      item({ code: 'BtnA', name: '按钮', type: 'BUTTON' }),
    ])

    expect(store.menus.map(m => m.key)).toEqual(['MenuA'])
    expect(store.menus[0]?.label).toBe('菜单A')
  })

  it('菜单按 order 排序；缺省 order 按 0 兜底', () => {
    const store = usePermissionStore()
    store.setPermissions([
      item({ code: 'B', name: 'B', type: 'MENU', order: 5, enable: true, path: '/b', show: true }),
      item({ code: 'A', name: 'A', type: 'MENU', enable: true, path: '/a', show: true }),
    ])
    expect(store.menus.map(m => m.key)).toEqual(['A', 'B'])
  })

  it('外链菜单：改写为 /iframe/{code} 内嵌路径，originPath 保留原始地址', () => {
    const store = usePermissionStore()
    store.setPermissions([
      item({ code: 'ShowDocs', name: '文档', type: 'MENU', enable: true, show: true, path: 'https://isme.top', order: 1 }),
    ])
    expect(store.menus[0]?.path).toBe('/iframe/show-docs')
    expect(store.menus[0]?.originPath).toBe('https://isme.top')
  })

  it('enable 的 MENU 才进 accessRoutes；外链不直接进（改写后 path 非 http，需二次判断）', () => {
    const store = usePermissionStore()
    store.setPermissions([
      item({ code: 'Normal', name: '常规', type: 'MENU', enable: true, path: '/n', show: false }),
      item({ code: 'Disabled', name: '停用', type: 'MENU', enable: false, path: '/d' }),
      item({ code: 'Ext', name: '外链', type: 'MENU', enable: true, show: false, path: 'https://x.com' }),
    ])
    const names = store.accessRoutes.map(r => r.name)
    expect(names).toContain('Normal')
    expect(names).toContain('Ext') // 外链改写为 /iframe/ext 后仍注册路由
    expect(names).not.toContain('Disabled')
  })

  it('路由 meta 携带 title/icon/keepAlive/parentKey，按钮权限提取为 btns', () => {
    const store = usePermissionStore()
    store.setPermissions([
      item({
        code: 'MenuBtns',
        name: '带按钮',
        type: 'MENU',
        enable: true,
        path: '/mb',
        show: false,
        keepAlive: true,
        icon: 'i-fe:home',
        layout: 'full',
        order: 1,
        children: [
          item({ code: 'AddUser', name: '新增用户', type: 'BUTTON' }),
          item({ code: 'Sub', name: '子菜单', type: 'MENU', enable: true, show: false, path: '/sub' }),
        ],
      }),
    ])
    const route = store.accessRoutes.find(r => r.name === 'MenuBtns')!
    expect(route.meta.title).toBe('带按钮')
    expect(route.meta.icon).toBe('i-fe:home?mask')
    expect(route.meta.keepAlive).toBe(true)
    expect(route.meta.layout).toBe('full')
    expect(route.meta.btns).toEqual([{ code: 'AddUser', name: '新增用户' }])
  })

  it('非法 layout 字符串在边界归一为默认布局（toLayoutMode）', () => {
    const store = usePermissionStore()
    store.setPermissions([
      item({ code: 'Bad', name: '坏布局', type: 'MENU', enable: true, path: '/bad', show: false, layout: 'not-a-layout' }),
      item({ code: 'Good', name: '好布局', type: 'MENU', enable: true, path: '/good', show: false, layout: 'simple' }),
    ])
    expect(store.accessRoutes.find(r => r.name === 'Bad')?.meta.layout).toBe('normal')
    expect(store.accessRoutes.find(r => r.name === 'Good')?.meta.layout).toBe('simple')
  })

  it('空菜单树：menus 为空数组不崩溃', () => {
    const store = usePermissionStore()
    store.setPermissions([])
    expect(store.menus).toEqual([])
    expect(store.accessRoutes).toEqual([])
  })
})
