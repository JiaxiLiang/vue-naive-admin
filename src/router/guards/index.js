import { createPageLoadingGuard } from './page-loading-guard'
// 导入页面加载状态守卫的创建函数
import { createPageTitleGuard } from './page-title-guard'
// 导入页面标题设置守卫的创建函数
import { createPermissionGuard } from './permission-guard'
// 导入权限控制守卫的创建函数
import { createTabGuard } from './tab-guard'
// 导入多标签页管理守卫的创建函数

export function setupRouterGuards(router) { // 导出一个设置函数，用于初始化路由守卫，接收路由实例作为参数
  createPageLoadingGuard(router) // 注册页面加载守卫，通常在路由开始时显示 Loading，结束时关闭
  createPermissionGuard(router) // 注册权限守卫，用于判断用户是否登录，是否有权访问当前页面
  createPageTitleGuard(router) // 注册页面标题守卫，根据路由配置动态修改浏览器标签页的 title
  createTabGuard(router) // 注册标签页守卫，用于管理多标签页系统的添加、关闭等逻辑
}
/*
  代码执行步骤顺序：

  1. 【模块导入】
     - 系统首先从 './page-loading-guard'、'./page-title-guard' 等文件中导入四个创建函数。
     - 此时这些函数只是被加载到内存中，并未执行。

  2. 【函数调用】
     - 外部代码（通常是 main.js 或 router/index.js）调用 setupRouterGuards(router)。
     - 传入已经创建好的 router 实例对象。

  3. 【注册加载守卫】
     - 执行 createPageLoadingGuard(router)。
     - 该函数内部通过 router.beforeEach 注册全局前置守卫，用于控制页面加载进度条的显示与隐藏。

  4. 【注册权限守卫】（关键步骤）
     - 执行 createPermissionGuard(router)。
     - 该函数内部注册全局前置守卫。
     - 逻辑通常包含：判断 Token 是否存在 -> 判断用户角色 -> 匹配路由 meta 中的权限。
     - 如果验证失败，通常会中断跳转并重定向到登录页（此时后续守卫可能不会触发）。

  5. 【注册标题守卫】
     - 执行 createPageTitleGuard(router)。
     - 该函数内部注册全局后置钩子（afterEach）或前置守卫。
     - 逻辑：读取当前路由对象的 meta.title 属性，并赋值给 document.title。

  6. 【注册标签守卫】
     - 执行 createTabGuard(router)。
     - 该函数内部注册全局后置钩子（afterEach）。
     - 逻辑：在路由跳转成功后，将新路由信息添加到系统的“已打开标签页列表”状态中（如 Vuex/Pinia store）。

  7. 【设置完成】
     - setupRouterGuards 函数执行完毕，返回 undefined。
     - 此时路由器已经具备了拦截、改标题、管理标签页等全部能力，应用准备就绪。
*/
