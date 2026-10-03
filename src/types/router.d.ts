import type { LayoutMode } from '@/settings'
import type { RouteBtn } from '@/types/models'

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题（document.title / 菜单 label） */
    title?: string
    /** 使用的布局 */
    layout?: LayoutMode
    /** 页面缓存开关 */
    keepAlive?: boolean
    /** 外链原始地址（iframe 承载） */
    originPath?: string
    /** 菜单图标 class（unocss icon，如 'i-fe:xxx?mask'） */
    icon?: string
    /** 菜单树父级 key */
    parentKey?: string | null
    /** 按钮级权限列表（v-permission 指令数据源） */
    btns?: RouteBtn[]
  }
}

export {}
