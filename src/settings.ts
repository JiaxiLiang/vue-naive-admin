import type { GlobalThemeOverrides } from 'naive-ui'
import type { PermissionItem } from '@/types/models'

/** 布局模式名单：LayoutMode 类型由它派生，新增布局只改这一处即可保持两处一致 */
export const LAYOUT_MODES = ['normal', 'full', 'empty', 'simple'] as const

export type LayoutMode = typeof LAYOUT_MODES[number]

export const defaultLayout: LayoutMode = 'normal'

/**
 * 把后端返回的 layout 字符串归一为合法 LayoutMode：
 * 合法值直通，缺省/非法值回退默认布局，把边界挡在渲染层之前
 */
export function toLayoutMode(value: string | null | undefined): LayoutMode {
  return LAYOUT_MODES.find(mode => mode === value) ?? defaultLayout
}

/** 全站唯一定色处：arco 色板与 naive 主题覆盖均从这里单源取值 */
export const defaultPrimaryColor = '#2F54EB'

/** 是否显示悬浮的布局配置入口（LayoutSetting 组件） */
export const layoutSettingVisible = true

/** 静态首屏只声明主色与圆角，运行时由 appStore.setThemeColor 按色板覆写 */
export const naiveThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: `${defaultPrimaryColor}FF`,
    borderRadius: '8px',
  },
}

/** 静态基础权限（外链类菜单，登录前即可用）；satisfies 校验数据形状与 PermissionItem 契约一致 */
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
    ],
  },
] satisfies PermissionItem[]
