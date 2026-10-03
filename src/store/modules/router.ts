// 权限仓库 主要作用就是重置路由表 用于退出换号的时候内存数据清了路由表没有
import type { AccessRoute } from '@/types/models'
import { defineStore } from 'pinia' // 从 pinia 库中导入 defineStore 方法，用于定义状态管理 store

export const useRouterStore = defineStore('router', () => { // 定义并导出一个名为 useRouterStore 的 store，id 为 'router'，使用组合式函数 (Setup) 写法
  const router = useRouter() // 正常要引用的 這是因爲有插件unplugin-auto-import
  // 调用 Vue Router 的 useRouter 获取全局路由器实例 (用于跳转、删除路由等操作)
  const route = useRoute()
  // 调用 Vue Router 的 useRoute 获取当前路由对象 (包含当前路径、参数、meta 等信息)

  function resetRouter(accessRoutes: AccessRoute[]): void { // 定义一个名为 resetRouter 的函数，用于重置路由，接收需要处理的动态路由列表作为参数
    accessRoutes.forEach((item) => {
      // foreach遍历函数 遍历传入的 accessRoutes 路由数组
      // name 不存在时 hasRoute 返回 false 短路跳过，! 断言不改变行为
      router.hasRoute(item.name!) && router.removeRoute(item.name!)
      // 逻辑判断：如果路由器中已存在该名称的路由，则将其移除（用于防止路由重复注册
      // hasroute检查路由是否存在返回布尔  rem是移除路由函数
    }) // 结束 forEach 循环
  } // 结束 resetRouter 函数定义

  return { // 将内部的 state 和 actions 暴露给外部组件使用
    router, // 暴露 router 实例
    route, // 暴露 route 对象
    resetRouter, // 暴露 resetRouter 方法
  } // 结束 return 对象
}) // 结束 defineStore 函数调用
/*
常见的属性知识点（路由配置 ui组件 后端数据库的接口文档决定）

### 1. Vue Router 需要（框架协议）
*   **来源**：Vue Router 官方文档规定，名字固定，不可更改。
*   **作用**：决定页面如何跳转、组件如何加载。

| 属性名 | 类型 | 必须性 | 作用解析 |
| :--- | :--- | :--- | :--- |
| **`path`** | String | ⭐ 必须有 | 路由地址。如 `/user/list`，决定浏览器地址栏显示内容。 |
| **`name`** | String | ⭐ 推荐有 | 路由唯一名称。用于 `router.push({ name: 'User' })` 跳转，比 path 更稳定。 |
| **`component`** | Object | ⭐ 必须有 | 对应的 Vue 组件。告诉路由加载哪个 `.vue` 文件。 |
| **`redirect`** | String | 可选 | 重定向地址。如访问 `/` 自动跳转到 `/home`。 |
| **`children`** | Array | 可选 | 嵌套路由。用于定义多级菜单结构。 |
| **`meta`** | Object | ⭐ 常用 | **元信息（万能口袋）**。自定义数据的大集合，存储标题、图标、权限码等。 |

---

### 2. UI 菜单组件需要（组件协议）
*   **来源**：UI 组件库（如 Ant Design Vue, Element Plus）官方文档规定。
*   **作用**：决定菜单树如何渲染、显示什么文字。

| 属性名 | 类型 | 必须性 | 作用解析 |
| :--- | :--- | :--- | :--- |
| **`label`** | String | ⭐ 必须有 | 菜单显示的文字。如“用户管理”。（注：Element UI 常用 `title`） |
| **`key`** | String | ⭐ 必须有 | 菜单唯一标识。用于高亮当前选中项，通常直接使用路由的 `name`。 |
| **`icon`** | Component | 推荐 | 菜单前面的小图标。 |
| **`children`** | Array | 可选 | 子菜单列表。用于构建树形结构。 |
| **`path`** | String | 可选 | 某些 UI 库需要此属性来实现点击菜单自动跳转。 |

---

### 3. 后端数据库需要（业务协议）
*   **来源**：后端 API 接口文档。这部分最灵活，不同公司业务不同。
*   **作用**：存储业务逻辑、排序规则、权限标识。

| 属性名 | 类型 | 必须性 | 作用解析 |
| :--- | :--- | :--- | :--- |
| **`id`** | Number | ⭐ 必须有 | 数据库主键，唯一标识这一条数据。 |
| **`parentId`** | Number | 常用 | 父级菜单 ID。用于构建树形结构（知道谁是爸爸）。 |
| **`code`** | String | ⭐ 常用 | 权限标识码。如 `system:user:list`，用于按钮级权限控制。 |
| **`type`** | String | ⭐ 常用 | 菜单类型。区分 `DIR`（目录）、`MENU`（菜单）、`BUTTON`（按钮）。 |
| **`orderNum`** | Number | 常用 | 排序号。决定菜单在页面上的排列顺序。 |
| **`visible`** | Boolean | 常用 | 是否显示。控制路由是否在菜单中展示（如隐藏的详情页）。 |
| **`status`** | Boolean | 常用 | 启用状态。如果是 `false`，前端通常直接过滤掉。 |

*/
