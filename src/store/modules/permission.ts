// 权限仓库：动态路由注册机制的中枢。数据流向：
// 守卫传入后端权限树 → setPermissions 过滤出 MENU 项 → getMenuItem 递归处理每个节点：
// 先经 generateRoute 生成路由记录收进 accessRoutes（真正 addRoute 由守卫完成），
// 再包装成菜单节点挂成 menus 树（供侧边栏渲染）
import type { AccessRoute, MenuItem, PermissionItem } from '@/types/models'
import { hyphenate } from '@vueuse/core'
import { defineStore } from 'pinia'
import { toLayoutMode } from '@/settings'
import { isExternal } from '@/utils'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    accessRoutes: [] as AccessRoute[], // 待注册的动态路由表（登出/换号时需整体卸载）
    permissions: [] as PermissionItem[], // 后端返回的原始权限树
    menus: [] as MenuItem[], // 由权限树派生的菜单树，供侧边栏渲染
  }),
  actions: {
    /**
     * 灌入权限树并派生菜单：只保留 MENU 类型，转换后按 order 升序
     * @param permissions 后端返回的权限树（MENU/BUTTON 混合节点）
     */
    setPermissions(permissions: PermissionItem[]) {
      this.permissions = permissions
      // 链式流水线：筛菜单项 → 转菜单节点 → 剔除隐藏项 → 排序，上一环输出即下一环输入
      this.menus = this.permissions
        .filter(item => item.type === 'MENU')
        .map(item => this.getMenuItem(item))
        .filter((item): item is MenuItem => !!item)
        .sort((a, b) => a.order - b.order)
    },
    /**
     * 递归把权限项转为菜单节点；副作用是把可访问路由收进 accessRoutes
     * @param item 当前权限项（MENU 类型）
     * @param parent 父菜单节点，隐藏型子项要挂到父级路由下
     * @returns 菜单节点；show=false 时返回 null（路由仍可注册，只是菜单不显示）
     */
    getMenuItem(item: PermissionItem, parent?: MenuItem): MenuItem | null {
      const route = this.generateRoute(item, item.show ? null : (parent?.key ?? null))
      // 未启用或仍是外链原始地址的路径不进路由表（外链已由 generateRoute 改写为 iframe 路径）
      if (item.enable && route.path && !route.path.startsWith('http'))
        this.accessRoutes.push(route)
      const menuItem: MenuItem = {
        label: route.meta.title,
        key: route.name,
        path: route.path,
        originPath: route.meta.originPath,
        // 图标用渲染函数交给 naive 菜单，挂载时才创建虚拟节点
        icon: () => h('i', { class: `${route.meta.icon} text-16` }),
        order: item.order ?? 0,
      }
      // children 仍是原始权限数据，须递归转换；只取直属下一级的 MENU 项
      const children = item.children?.filter(item => item.type === 'MENU') || []
      if (children.length) {
        menuItem.children = children
          .map(child => this.getMenuItem(child, menuItem))
          .filter((item): item is MenuItem => !!item)
          .sort((a, b) => a.order - b.order)
        // 子级全部无效时删掉属性，避免渲染出空分组
        if (!menuItem.children.length)
          delete menuItem.children
      }
      // 隐藏型菜单（如详情页）只注册路由，不出现在菜单树
      if (!item.show)
        return null
      return menuItem
    },
    /**
     * 权限项 → 路由记录。外链改写为 /iframe/:code 内嵌路径，原始地址存入 meta.originPath；
     * 按钮型子项收进 meta.btns，供按钮级权限使用
     * @param item 当前权限项
     * @param parentKey 隐藏型菜单所属父路由的 key
     */
    generateRoute(item: PermissionItem, parentKey: string | null): AccessRoute {
      let originPath
      if (item.path && isExternal(item.path)) {
        originPath = item.path
        // 外链统一走 iframe 容器组件内嵌打开；路径用连字符化的 code 保证合法
        item.component = '/src/views/iframe/index.vue'
        item.path = `/iframe/${hyphenate(item.code)}`
      }
      return {
        name: item.code,
        path: item.path,
        redirect: item.redirect,
        // 此处 component 仍是字符串路径，由权限守卫经 import.meta.glob 换成懒加载组件
        component: item.component,
        meta: {
          originPath,
          icon: `${item.icon}?mask`,
          title: item.name,
          // 后端 layout 字符串在边界归一为 LayoutMode，非法值回退默认布局
          layout: toLayoutMode(item.layout),
          keepAlive: !!item.keepAlive,
          parentKey,
          btns: item.children
            ?.filter(item => item.type === 'BUTTON')
            .map(item => ({ code: item.code, name: item.name })),
        },
      }
    },
    /** 重置权限状态（登出/换号时由 auth.resetLoginState 调用） */
    resetPermission() {
      this.$reset()
    },
  },
})
