import type { GlobalThemeOverrides } from 'naive-ui'
import type { PermissionItem } from '@/types/models'

/** 四种布局常量（LayoutMode 由 keyof typeof 派生，两处永远一致） */
export const LAYOUT_MODES = ['normal', 'full', 'empty', 'simple'] as const

export type LayoutMode = typeof LAYOUT_MODES[number]

export const defaultLayout: LayoutMode = 'normal'

/** 后端返回的 layout 字符串归一为 LayoutMode：合法值直通，缺省/非法值回退默认布局 */
export function toLayoutMode(value: string | null | undefined): LayoutMode {
  return LAYOUT_MODES.find(mode => mode === value) ?? defaultLayout
}

export const defaultPrimaryColor = '#316C72'

// 控制 LayoutSetting 组件是否可见
export const layoutSettingVisible = true

export const naiveThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#316C72FF',
    primaryColorHover: '#316C72E3',
    primaryColorPressed: '#2B4C59FF',
    primaryColorSuppl: '#316C72E3',
  },
}

/** satisfies 保留字面量最窄推断，同时校验静态数据形状与 PermissionItem 契约一致 */
export const basePermissions = [
  {
    code: 'ExternalLink',
    name: '外链(可内嵌打开)',
    type: 'MENU',
    icon: 'i-fe:external-link',
    order: 98,
    enable: true,
    show: true,
    children: [
      {
        code: 'ShowDocs',
        name: '项目文档',
        type: 'MENU',
        path: 'https://isme.top',
        icon: 'i-me:docs',
        order: 1,
        enable: true,
        show: true,
      },
      {
        code: 'ApiFoxDocs',
        name: '接口文档',
        type: 'MENU',
        path: 'https://apifox.com/apidoc/shared-ff4a4d32-c0d1-4caf-b0ee-6abc130f734a',
        icon: 'i-me:apifox',
        order: 2,
        enable: true,
        show: true,
      },
      {
        code: 'NaiveUI',
        name: 'Naive UI',
        type: 'MENU',
        path: 'https://www.naiveui.com/zh-CN/os-theme',
        icon: 'i-me:naiveui',
        order: 3,
        enable: true,
        show: true,
      },
      {
        code: 'MyBlog',
        name: '博客-掘金',
        type: 'MENU',
        path: 'https://juejin.cn/user/1961184475483255/posts',
        icon: 'i-simple-icons:juejin',
        order: 4,
        enable: true,
        show: true,
      },
    ],
  },
] satisfies PermissionItem[]
