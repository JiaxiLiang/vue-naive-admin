import type { App, Directive, VNode } from 'vue'
import { withDirectives } from 'vue' // 从vue中导入withDirectives函数
// 用于给虚拟节点添加指令
import { router } from '@/router' // 从路由模块导入router实例

const permission: Directive<HTMLElement, string> = { // 定义权限指令对象
  mounted(el, binding) { // 指令挂载时执行的钩子函数
    const currentRoute = unref(router.currentRoute) // 获取当前路由信息（使用unref解包响应式对象）
    const btns = currentRoute.meta?.btns?.map(item => item.code) || [] // 获取当前路由元信息中的按钮权限数组，提取code属性
    if (!btns.includes(binding.value)) { // 检查当前按钮权限码是否在允许的权限列表中
      el.remove() // 如果没有权限，则移除该元素
    }
  },
}

export function setupDirectives(app: App): void { // 导出设置指令的函数
  app.directive('permission', permission) // 在Vue应用中注册'permission'自定义指令
}

/**
 * 用于h函数使用自定义权限指令
 *
 * @param vnode 虚拟节点
 * @param code 权限码
 * @returns 返回一个包含权限指令的vnode
 *
 * 使用示例：withPermission(h('button', {class: 'text-red-500'}, '删除'), 'user:delete')
 *
 */
export function withPermission(vnode: VNode, code: string): VNode { // 导出withPermission函数，用于在h函数中使用权限指令
  return withDirectives(vnode, [[permission, code]]) // 使用withDirectives给虚拟节点添加permission指令，传入权限码
}

/*  代码执行步骤：
1. 导入必要的依赖：从vue导入withDirectives，从路由模块导入router
2. 定义permission指令对象，包含mounted钩子函数
3. 在mounted钩子中：
   a. 获取当前路由信息
   b. 提取当前路由的按钮权限列表
   c. 检查绑定值（权限码）是否在权限列表中
   d. 如果没有权限，则移除元素
4. 导出setupDirectives函数，用于在Vue应用中注册permission指令
5. 导出withPermission函数，用于在h函数中使用权限指令
6. withPermission函数使用withDirectives给虚拟节点添加permission指令
*/
