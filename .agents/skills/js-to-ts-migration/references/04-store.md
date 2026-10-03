# 阶段 5：Pinia store

迁移范围：`src/store/index.js`、`helper.js`、`modules/` 下 6 个模块（app、auth、permission、router、tab、user、index）。

**风格决策**：保持 options store 写法不变，只加类型。改成 setup store 属于风格重构，超出"纯等价迁移"范围（可作为面试讨论点记入进度文档）。唯一的例外是 `modules/router.js`——它本来就是 setup store 写法，迁移后类型自动推导，不用特殊处理。

## 5.1 通用做法（options store 的 TS 要点）

1. **state 字段初始值与实际类型不符时用 `as` 断言**，不要改运行时默认值：

```ts
state: () => ({
  userInfo: null as UserInfo | null,   // 原值 null，类型允许 UserInfo
}),
```

2. options store 的 getters/actions 里 `this` 类型由 Pinia 自动推导，不需要手动标注。
3. `persist` 插件的配置对象（key/pick/storage）类型由 `pinia-plugin-persistedstate` 提供，无需额外标注。

## 5.2 各模块 State 清单

### modules/user.js → user.ts

```ts
state: () => ({
  userInfo: null as UserInfo | null,
}),
// getters: userId/username/nickName/avatar/currentRole/roles —— this.userInfo 收窄后自动推导
// actions: setUser(user: UserInfo), resetUser()
```

### modules/auth.js → auth.ts

```ts
state: () => ({
  accessToken: undefined as string | undefined,
}),
// setToken({ accessToken }: { accessToken: string })
// persist: { key: 'vue-naivue-admin_auth' }  ← 注意：key 里的 'naivue' 是原文件拼写，保留不改行为，加 TODO 注释
```

### modules/app.js → app.ts

```ts
import type { GlobalThemeOverrides } from 'naive-ui'

state: () => ({
  collapsed: false,
  isDark: useDark(),                     // 类型收窄说明见下
  layout: defaultLayout as LayoutMode,   // LayoutMode 来自 settings.ts
  primaryColor: defaultPrimaryColor,
  naiveThemeOverrides,                   // settings.ts 已标 GlobalThemeOverrides
}),
// setCollapsed(b: boolean)、setLayout(v: LayoutMode)、setPrimaryColor(color: string)
// setThemeColor(color = this.primaryColor, isDark = this.isDark)
```

`useDark()` 返回 `WritableComputedRef<boolean>`，放进 state 工厂后被 Pinia 解包，`this.isDark` 类型是 `boolean`——直接写，不要给 state 加显式接口（显式 `interface { isDark: boolean }` 与工厂返回值类型不一致会报错）。`generate(color, { list: true, dark })` 来自 @arco-design/color，自带类型；`colors[5]` 是索引访问，strict 未全开阶段无需处理。

### modules/permission.js → permission.ts

```ts
import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from '@/types/models'   // 若未在 models.ts 定义，本文件内定义并导出

export interface MenuItem {
  label?: string
  key: RouteRecordName
  path?: string
  originPath?: string
  icon?: () => VNode
  order: number
  children?: MenuItem[]
}

state: () => ({
  accessRoutes: [] as RouteRecordRaw[],
  permissions: [] as PermissionItem[],
  menus: [] as MenuItem[],
}),
// setPermissions(permissions: PermissionItem[])
// getMenuItem(item: PermissionItem, parent?: MenuItem): MenuItem | null
//   —— 原实现末尾可能 return null，签名必须允许 null；调用处 .filter(item => !!item) 已兼容
// generateRoute(item: PermissionItem, parentKey: string | null): RouteRecordRaw
//   —— 注意：generateRoute 内部会改写 item.component 为 '/src/views/iframe/index.vue' 字符串、
//      item.path 为 iframe 路径（副作用！），保持原样只加 TODO 注释
//   —— meta 对象就是 RouteMeta 扩展字段（阶段 7 的 declare merging 会给它们类型），
//      本阶段先写 meta: { ... } 原样，若 typecheck 报错则提前做阶段 7 的 RouteMeta 声明合并（允许跨阶段引用）
// resetPermission()
```

`delete menuItem.children`（递归分支里）：`children?: MenuItem[]` 可选属性允许 delete，类型成立。

### modules/router.js → router.ts

setup store 写法，类型自动推导，仅补参数：

```ts
function resetRouter(accessRoutes: RouteRecordRaw[]): void {
  accessRoutes.forEach((item) => {
    router.hasRoute(item.name!) && router.removeRoute(item.name!)
    // RouteRecordRaw 的 name 类型是 RouteRecordName | undefined，hasRoute/removeRoute 需要非空
    // 原行为：name 不存在的路由 hasRoute 返回 false，短路跳过 → ! 断言不改变行为
  })
}
```

### modules/tab.js → tab.js → tab.ts

```ts
export interface TabItem {
  path: string
  name?: RouteRecordName
  title?: string
  keepAlive?: boolean
  /** 实际字段以 guards/tab-guard.js 的 addTab 调用为准，迁移 tab-guard 时回填此接口 */
  [key: string]: unknown
}

state: () => ({
  tabs: [] as TabItem[],
  activeTab: '',
  reloading: false,
}),
// setActiveTab(path: string)、setTabs(tabs: TabItem[])、addTab(tab: TabItem)
// reloadTab(path: string, keepAlive?: boolean)
// removeTab(path: string) —— 内部 this.tabs[this.tabs.length - 1].path 是潜在空引用，
//   strict 阶段（阶段 9）会暴露，本阶段先记录到进度文档
```

### modules/index.js、store/index.js → index.ts

桶文件，加后缀。

### helper.js → helper.ts

```ts
export async function getUserInfo(): Promise<UserInfo> {
  const res = await api.getUser()
  const { id, username, profile, roles, currentRole } = res.data || {}
  // res.data 的类型是 ApiResult<UserInfo>['data']；原实现从 profile 取 avatar/nickName 等，
  // 说明后端原始 UserInfo 有嵌套 profile 字段 → models.ts 的 UserInfo 需要与后端原始形状分开：
  // 新增 interface RawUserInfo extends UserInfo { profile?: { avatar?, nickName?, gender?, address?, email? } }
  // getUser 的泛型改 request.get<RawUserInfo>，本函数返回重组后的 UserInfo
  return { id, username, avatar: profile?.avatar, ... }
}

export async function getPermissions(): Promise<PermissionItem[]> { /* 原实现不动 */ }
```

> 这是本次迁移为数不多需要**微调 models.ts** 的点：区分"后端原始形状"与"前端重组形状"。两种做法：a) 加 `RawUserInfo`；b) models.ts 的 UserInfo 直接含 `profile?` 嵌套。选 a（前端形状保持干净），在进度文档记录。

## 验收

- `pnpm typecheck` 通过
- 手测：登录后刷新页面（permission-guard 走"无 userInfo 补录"分支，验证 helper/permission store 类型链路）；切换角色；退出登录（resetLoginState 跨 5 个 store 的重置链）；标签页增删切换
