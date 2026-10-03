import type { Router } from 'vue-router'
import { useTabStore } from '@/store' // 用于操作标签页数据

export const EXCLUDE_TAB = ['/404', '/403', '/login'] // 导出常量 EXCLUDE_TAB，定义不需要在标签栏中显示的路由路径黑名单

export function createTabGuard(router: Router): void { // 导出函数 createTabGuard，接收 router 实例作为参数，用于创建标签页管理守卫
  router.afterEach((to) => {
    if (EXCLUDE_TAB.includes(to.path)) // 判断目标路由路径是否存在于黑名单中
      return // 若在黑名单中，则直接返回，不执行后续添加标签页的逻辑
    const tabStore = useTabStore() // 获取标签页状态管理实例（在守卫内部调用确保 Pinia 已初始化）
    const { name, fullPath: path } = to
    // 从to解构出路由名称 name赋值给{}的变量name，fullPath（完整路径）同理 重命名为 path
    const title = to.meta?.title// 如果 to.meta 存在，就取 to.meta.title 否则也不会报错
    // 使用可选链获取路由元信息中的标题
    const icon = to.meta?.icon // 使用可选链获取路由元信息中的图标
    const keepAlive = to.meta?.keepAlive // 使用可选链获取路由元信息中的缓存标识
    tabStore.addTab({ name, path, title, icon, keepAlive }) // 调用 store 中的 addTab 方法，将提取的路由信息对象添加到标签页列表中
  })
}

/*
                  [ 路由跳转成功: afterEach 触发 ]
                             │
                             ▼
            ┌─────────────────────────────────┐
            │ 步骤1: 检查路径是否在黑名单中?   │
            │  (EXCLUDE_TAB 包含该路径?)      │
            └─────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
          [ 是: 在列表内 ]        [ 否: 不在列表 ]
                 │                       │
                 │                       ▼
                 │         ┌───────────────────────────┐
                 │         │ 步骤2: 获取标签页仓库实例    │
                 │         │    useTabStore()          │
                 │         └───────────────────────────┘
                 │                       │
                 │                       ▼
                 │         ┌───────────────────────────┐
                 │         │ 步骤3: 解构提取路由信息     │
                 │         │ name, fullPath, title     │
                 │         │ icon, keepAlive           │
                 │         └───────────────────────────┘
                 │                       │
                 │                       ▼
                 │         ┌───────────────────────────┐
                 │         │ 步骤4: 更新状态仓库         │
                 │         │  tabStore.addTab()        │
                 │         └───────────────────────────┘
                 │                       │
                 └───────────┬───────────┘
                             ▼
                       [ 流程执行结束 ]

*/
