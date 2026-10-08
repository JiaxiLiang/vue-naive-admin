import type { App, Directive, VNode } from 'vue'
import { withDirectives } from 'vue'
import { router } from '@/router'

/** 按钮级权限指令：挂载时比对当前路由下发的按钮权限码，无权限直接移除元素 */
const permission: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    // 当前路由 meta.btns 是后端下发的按钮权限清单，提取权限码集合
    const currentRoute = unref(router.currentRoute)
    const btns = currentRoute.meta?.btns?.map(item => item.code) || []
    // 无权限时从 DOM 移除节点（比 v-show 彻底，不占文档流）
    if (!btns.includes(binding.value)) {
      el.remove()
    }
  },
}

/** 注册全局自定义指令，模板中以 v-permission="'权限码'" 使用 */
export function setupDirectives(app: App): void {
  app.directive('permission', permission)
}

/**
 * 在 h 函数渲染写法中给虚拟节点附加权限指令（模板里能写 v-permission，render 函数需手动 withDirectives）。
 * @param vnode 虚拟节点
 * @param code 权限码
 * @returns 附加了权限指令的 vnode
 * @example withPermission(h('button', { class: 'text-red-500' }, '删除'), 'user:delete')
 */
export function withPermission(vnode: VNode, code: string): VNode {
  return withDirectives(vnode, [[permission, code]])
}
