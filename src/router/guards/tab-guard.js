import { useTabStore } from '@/store' // 从统一状态管理目录导入 useTabStore 钩子，用于操作标签页数据

export const EXCLUDE_TAB = ['/404', '/403', '/login'] // 导出常量 EXCLUDE_TAB，定义不需要在标签栏中显示的路由路径黑名单

export function createTabGuard(router) { // 导出函数 createTabGuard，接收 router 实例作为参数，用于创建标签页管理守卫
  router.afterEach((to) => { // 注册全局后置钩子，在每次路由跳转成功完成后触发，to 为目标路由对象
    if (EXCLUDE_TAB.includes(to.path)) // 判断目标路由路径是否存在于黑名单中
      return // 若在黑名单中，则直接返回，不执行后续添加标签页的逻辑
    const tabStore = useTabStore() // 获取标签页状态管理实例（在守卫内部调用确保 Pinia 已初始化）
    const { name, fullPath: path } = to // 从目标路由对象中解构出路由名称 name，并将 fullPath 重命名为 path
    const title = to.meta?.title // 使用可选链获取路由元信息中的标题
    const icon = to.meta?.icon // 使用可选链获取路由元信息中的图标
    const keepAlive = to.meta?.keepAlive // 使用可选链获取路由元信息中的缓存标识
    tabStore.addTab({ name, path, title, icon, keepAlive }) // 调用 store 中的 addTab 方法，将提取的路由信息对象添加到标签页列表中
  }) // 结束 afterEach 回调函数
} // 结束 createTabGuard 函数定义

/*
代码执行步骤顺序：
1. 导入依赖：引入操作标签页所需的 Pinia Store 钩子。
2. 定义黑名单：声明 EXCLUDE_TAB 常量，包含不需要在标签栏展示的特定路由路径。
3. 定义守卫函数：导出 createTabGuard 函数，用于向路由实例注入标签页管理逻辑。
4. 注册后置钩子：在函数内部调用 router.afterEach，确保每次路由跳转成功后执行逻辑。
5. 黑名单拦截：在回调中判断当前跳转的目标路径是否在黑名单中，若存在则提前返回终止执行。
6. 获取 Store 实例：调用 useTabStore() 获取标签页状态仓库实例。
7. 提取路由信息：从目标路由对象 to 中解构出 name、fullPath (重命名为 path)，以及 meta 中的 title、icon、keepAlive。
8. 添加标签页：调用 tabStore.addTab 方法，将组装好的路由信息对象存入状态仓库，从而在界面上新增一个标签页。
*/
