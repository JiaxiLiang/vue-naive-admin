# 阶段 7：router + directives + layouts

## 7.1 前置：RouteMeta 声明合并（src/types/router.d.ts）

动态路由的 meta 字段全在 `permission.js` 的 `generateRoute` 里产出，按实际字段合并：

```ts
import 'vue-router'
import type { RouteBtn } from '@/types/models'
import type { LayoutMode } from '@/settings'

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
```

> 注意 `parentKey` 必须允许 `null`（generateRoute 传 `item.show ? null : parent?.key`）。若阶段 5 迁移 permission store 时已提前做过本步骤，这里核对字段齐全即可。

## 7.2 router/index.js → index.ts

- `setupRouter(app: App): Promise<void>`（`import type { App } from 'vue'`）
- 路由实例 `router` 的类型由 `createRouter` 推导（`Router`），`history` 三元分支保持原样

## 7.3 router/basic-routes.js → basic-routes.ts

```ts
import type { RouteRecordRaw } from 'vue-router'

export const basicRoutes: RouteRecordRaw[] = [ /* 原内容不动 */ ]
```

或者用 `satisfies RouteRecordRaw[]` 保留更精确的字面量类型（推荐，登录页/首页的 meta 会获得精确类型）。

## 7.4 router/guards/ 5 个文件 → .ts

| 文件 | 类型要点 |
|---|---|
| index.js | `setupRouterGuards(router: Router): void`；把 5 个守卫函数挨个传入 |
| page-loading-guard.js | `beforeEach`/`afterEach` 回调参数 `to`/`from` 类型由 router.beforeEach 签名推导，不要手写 |
| page-title-guard.js | `document.title = to.meta.title`——RouteMeta 合并后 title 可选，若原实现有 `?? ''` 兜底保持原样 |
| permission-guard.js | 见下方详述 |
| tab-guard.js | `to.meta.keepAlive` 等；给 tab store addTab 传参时对照 `TabItem` 接口回填缺失字段 |

**permission-guard.js**（最复杂的守卫）：

```ts
import type { Router } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

const WHITE_LIST: string[] = ['/login', '/404']

export function createPermissionGuard(router: Router): void {
  router.beforeEach(async (to): Promise<boolean | RouteLocationRaw> => {
    // 所有 return true / return { path: ... } / return { ...to, replace: true } 分支类型自动满足
    // import.meta.glob 一行补类型：
    const routeComponents = import.meta.glob('@/views/**/*.vue')
    //   类型自动为 Record<string, () => Promise<unknown>>
    //   route.component = routeComponents[route.component] || undefined
    //   赋值目标是 RouteRecordRaw['component']，需要断言：
    //   route.component = (routeComponents[route.component] as RouteRecordRaw['component']) || undefined
    // api.validateMenuPath(to.path) 已返回 Promise<ApiResult<boolean>>，const { data: hasMenu } 自动布尔
  })
}
```

`return { ...to, replace: true }` 的 `replace` 字段：`to` 是 `RouteLocationNormalized`，展开后赋给 `RouteLocationRaw` 需要断言 `return { ...to, replace: true } as RouteLocationRaw`（vue-router 的类型历史包袱，属正常现象）。

## 7.5 directives/index.js → index.ts

```ts
import type { Directive, VNode } from 'vue'

const permission: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const currentRoute = unref(router.currentRoute)
    const btns = currentRoute.meta?.btns?.map(item => item.code) || []
    if (!btns.includes(binding.value)) {
      el.remove()
    }
  },
}

export function setupDirectives(app: App): void
export function withPermission(vnode: VNode, code: string): VNode
```

> 补充：`v-permission` 在模板里使用需要指令类型提示的话，可加 `src/types/directives.d.ts` 做全局指令声明（`declare module 'vue' { interface GlobalDirectives { vPermission: Directive<...> } }`，vue 3.5 支持 GlobalDirectives 接口）。可选增强，不是必须。

## 7.6 layouts/ 20 个文件 → lang="ts"

文件清单：`components/`（AppProvider 等公共件）、`full/`、`normal/`、`empty/`、`simple/` 四套布局各自的 index/header 等。

统一做法：
1. `<script setup>` → `<script setup lang="ts">`
2. `defineProps` 对象语法 → `withDefaults(defineProps<{...}>(), {...})`；单纯布尔开关 props 直接内联
3. `useAppStore()`/`useRouterStore()` 等已迁移，全部自动推导；`useRouterStore().router` 类型是 `Router`
4. 布局切换组件（LayoutSetting）里 `layout` 的取值集合用 `LayoutMode`（settings.ts 导出），`v-model` 绑定处如需字面量数组用 `as const`：

```ts
const layouts: { value: LayoutMode, label: string }[] = [
  { value: 'normal', label: '侧边菜单' },
  { value: 'head', label: '顶部菜单' },   // ← 以组件内实际选项为准，LayoutMode 联合类型若缺值回 settings.ts 补
]
```

> **回填机制**：迁移 layouts 时若发现 `layout` 的实际取值超出了 settings.ts 的 `LayoutMode` 联合，回 settings.ts 扩充联合类型——单一事实来源原则。

5. header 组件里的 `handleLinkClick(url: string)` 之类的事件回调逐一补参数

## 验收

- `pnpm typecheck` 通过
- 手测：四种布局逐一切换；hash/history 两种模式各启动一次；外链菜单（iframe 承载，验证 generateRoute 的 originPath 链路）；v-permission 控制的按钮显隐（用户页"超管专属"按钮）；刷新页面权限补录；document.title 随页面变化
