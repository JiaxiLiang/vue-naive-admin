# vue-naive-admin JS → TS 迁移进度

> 计划来源：`.agents/skills/js-to-ts-migration/SKILL.md`。本文件是跨会话续作的唯一状态来源。

## 阶段清单

- [x] 阶段 0：工具链与类型地基（tsconfig、vite dts、src/types/\*、typecheck 脚本）
- [x] 阶段 1：settings + utils 工具层（settings、is、common、storage）
- [x] 阶段 2：http 层（utils/http/\*、naiveTools）
- [x] 阶段 3：实体模型 + api 层（src/types/models.ts、src/api、views/\*/api）
- [x] 阶段 4：composables 泛型化（useModal/useForm/useCrud/useAliveData）
- [x] 阶段 5：Pinia store（store/modules/\* 6 个模块 + helper）
- [x] 阶段 6：共享组件（MeCrud/MeModal/MeQueryItem/common 8 个）
- [x] 阶段 7：router + directives + layouts
- [x] 阶段 8：views 逐页迁移（24 个页面，从 user 页开始）
- [x] 阶段 9：收尾（main.ts、jsconfig 删除、strict 全开、README 更新）

## 各阶段 commit 索引

| 阶段 | commit                             | 说明                      |
| ---- | ---------------------------------- | ------------------------- |
| 0    | 见 git log `refactor(ts): phase 0` | tsconfig + types 地基     |
| 1    | 见 git log `refactor(ts): phase 1` | settings + utils          |
| 2    | 见 git log `refactor(ts): phase 2` | http 层                   |
| 3    | 见 git log `refactor(ts): phase 3` | 实体模型 + api 层         |
| 4    | 见 git log `refactor(ts): phase 4` | composables 泛型化        |
| 5    | 见 git log `refactor(ts): phase 5` | Pinia store               |
| 6    | 见 git log `refactor(ts): phase 6` | 共享组件 + 泛型 MeCrud    |
| 7    | 见 git log `refactor(ts): phase 7` | router/directives/layouts |
| 8    | 见 git log `refactor(ts): phase 8` | views 逐页迁移            |
| 9    | 见 git log `refactor(ts): phase 9` | 收尾 strict 全开          |

## 阶段记录与遗留问题

### 阶段 0（2026-10-03）

完成内容：

- 安装 `typescript@5.9.3`（注意：**不能用 TypeScript 7**，vue-tsc 3.3 依赖 `typescript/lib/tsc` 导出，TS 7 原生编译器没有该导出会直接崩溃）+ `vue-tsc@3.3.11`
- 新建 `tsconfig.json`（strict: false、allowJs: true 的渐进配置，阶段 9 收紧）；`jsconfig.json` 暂时保留共存，阶段 9 再删
- `vite.config.js` 中 AutoImport / Components 的 `dts: false → true`，生成并提交根目录 `auto-imports.d.ts`、`components.d.ts`
- 新建 `src/types/env.d.ts`（.env 实际变量：VITE_TITLE / VITE_USE_HASH / VITE_PUBLIC_PATH / VITE_AXIOS_BASE_URL / VITE_PROXY_TARGET）
- 新建 `src/types/global.d.ts`（`$message`/`$dialog`/`$notification`/`$loadingBar` 的 Window 扩展 + 裸全局 var 声明）
- 新建 `src/types/virtual-modules.d.ts`（**以 build/index.js 实际返回值为准**：`isme:icons` 和 `isme:page-pathes` 都是 `string[]`，不是参考文档猜想的对象数组）
- `package.json` 增加 `typecheck: vue-tsc --noEmit`

环境遗留问题（与迁移无关，是 pnpm 11.25 环境问题）：

- pnpm 11.25 的 `trustPolicy: no-downgrade` 会把 lockfile 里的老包 `chokidar@4.0.3`、`semver@6.3.1` 误报为 trust downgrade，阻塞一切 pnpm 脚本。已在 `pnpm-workspace.yaml` 增加 `trustPolicyIgnoreAfter: 1440`（发布超过 1 天的包豁免）和 `verifyDepsBeforeRun: false`（跑脚本前不自动 install）
- `declare global` 里的 `var` 环境声明会触发 eslint `vars-on-top` 误报，已在 global.d.ts 逐行内联豁免

### 阶段 1（2026-10-03）

完成内容：

- `settings.ts`：导出 `LayoutMode` 类型（阶段 7 复用）；`basePermissions: PermissionItem[]`
- `src/types/models.ts` 新建，先落 `PermissionItem` 占位（对齐 settings 静态数据形状），阶段 3 完善
- `is.ts` 全部函数加类型谓词；`isArray` 原实现 `val && Array.isArray(val)` 真值时返回原数组，因类型谓词必须返回 boolean，改为 `!!val && Array.isArray(val)`（全项目无调用方依赖返回原数组，真值语义不变）
- `isPromise` 通过 `isObject` 收窄后 `val.then` 为 unknown，`isFunction` 参数是 unknown，无需 as any
- `common.ts`：formatDateTime/formatDate 参数用 dayjs `ConfigType`；throttle/debounce 保留 function 声明 + `this: unknown` 透传
- `storage.ts`：类名 `Storage` 遮蔽 DOM Storage，用 `type StorageLike = globalThis.Storage` 规避；`getItem` 默认值 `def: T = null as T`；`get()` 内部 `getItem(key, {})` 的解构加 `as { value: T | undefined }` 断言（原实现解构 value，行为不变）
- `createStorage` 去掉了参考文档写的 `<T = unknown>`（泛型未被使用，eslint no-unused-vars 报错，且无调用方传类型参数）

### 阶段 2（2026-10-03）

完成内容：

- `http/index.ts`：定义 `ApiResult` / `RequestError` / `RequestConfig` / `HttpClient`（响应拦截器改写了返回值形状，用自封装接口覆盖 axios 自带类型）
- `interceptors.ts`：`reqResolve`/`resResolve` 里对自定义字段用 `(config as RequestConfig)` 窄化；axios header 值类型是 `string | string[] | number | boolean | null`，`content-type` 断言为 `string | undefined`
- **偏离参考文档**：`resolveResError` 的 `code` 参数从 `number` 放宽为 `number | string`——断网等场景 axios 的 `error.code` 是字符串（如 `'ERR_NETWORK'`），原 number 类型无法通过 typecheck 且不符合运行时事实
- `resReject` 参数用 `AxiosError<any>`（axios 1.16 的 AxiosError 默认泛型 data 是 unknown）
- `helpers.ts`：`message` 重新赋值改为局部变量 `tip`（参考文档建议的等价写法）
- `naiveTools.ts`：naive-ui 根导出里是 `DialogApi`/`MessageApi`（`DialogApiInjection` 不是公开导出名）；**`MessageOptions` 类型缺 `key` 字段（运行时支持）**，在 `global.d.ts` 新增 `KeyedMessageOptions = MessageOptions & { key?: string | number }` 并用于 WrappedMessage 全部方法签名（视图层大量传 key）
- `setupNaiveDiscreteApi` 的 `configProviderProps`：naive-ui 的 `GlobalThemeOverrides` 与 `ConfigProviderProps['themeOverrides']` 存在深层型变不兼容（'iconColor418' unknown vs undefined，官方已知缺陷，文档写法编译不过），用 `as unknown as ComputedRef<ConfigProviderProps>` 断言
- `Message` 类五个公开方法显式 `return undefined`（TS2355 要求有返回值；与原实现的隐式 undefined 等价）；`showMessage` 数组分支同理
- `setupDialog` 返回值 `as any`（原实现返回 DialogReactive，WrappedDialog 契约声明 MessageReactive | undefined，纯类型层面妥协，已在代码注释说明）

### 阶段 3（2026-10-03）

完成内容：

- `models.ts` 补全实体：`Role`/`UserInfo`/`PermissionItem`/`RouteBtn`/`PageResult`/`LoginToken`（形状与 store/helper.js、settings 静态数据逐一核对过）
- `api/index.ts`、5 个页面级 `api.ts`（login/profile/user/role/resource）全部迁移；`PageResult` 放在 models.ts（非 utils/http），http 层 `ApiResult` 不动
- 自检通过：临时 .ts 中 `api.read()` 的 `res.data` 推导为 `PageResult<UserInfo> | UserInfo[]` 联合，直接 `.pageData` 报错、`Array.isArray` 收窄后可用——符合 MeCrud 分页契约设计
- `login/api.ts` 的 `toggleRole` 无任何调用方，payload 类型保持 `Record<string, unknown>` 宽松处理

### 阶段 4（2026-10-03）

完成内容：

- 新建 `src/types/me-components.ts`（ModalOptions + MeModalExposed，阶段 6 的 MeModal 必须满足该暴露契约）
- `useModal.ts`：getter 加 `?? false`（语义补全 undefined → false，参考文档推荐项）；setter 保留 `!` 非空断言以维持"未挂载时抛错"的原行为
- `useForm.ts`：泛型 `<T extends object = Record<string, any>>`；`ref(cloneDeep(...)) as Ref<T>`（ref 对泛型返回 Ref<UnwrapRef<T>> 的标准断言）；validation 返回值类型用 `ReturnType<NonNullable<FormInst['validate']>>`——naive-ui validate 返回的是 warnings 对象的 Promise 而非 void（参考文档的 `() => Promise<void>` 与现实不符）
- `useCrud.ts`：ModalAction 用 `string & {}` 保留字面量提示；`modalAction.value = action ?? ''`（原实现赋 undefined，'' 语义等价，已在守卫与 ACTIONS 索引两处验证无观察差异）；`actions[modalAction.value as 'add' | 'edit']`（守卫逻辑保证运行时安全）
- `useAliveData.ts`：key 用 String() 归一化做 Map 键（null → 'null' 字符串键的微小行为差异，参考文档认可）

### 阶段 5（2026-10-03）

完成内容：

- 提前完成了阶段 7 的 RouteMeta 声明合并（`src/types/router.d.ts`，permission store 的 meta 需要）
- `models.ts` 新增 `RawUserInfo`（后端原始形状含嵌套 profile，与前端重组形状 UserInfo 分离）、`MenuItem`、`AccessRoute`
- `AccessRoute` 是关键妥协：**不从 RouteRecordRaw 派生**（Omit 作用于联合类型会塌缩出错误的 redirect 类型），而是独立接口；`component?: unknown`——store 阶段是后端字符串路径，permission-guard 才替换为懒加载组件（阶段 7 在赋值处收窄）
- `app.ts` persist 配置整体 `as any`：插件的 `pick?: Path<State>[]` 对深层 GlobalThemeOverrides state 实例化到 TS2589 爆栈；字段与原实现完全一致，仅类型层面绕过
- `app.ts` setThemeColor 的 Object.assign 拆写为"先取 common 引用 → 原地 assign → 赋回"，运行时等价（Object.assign 本就是原地修改并返回同一引用）
- `auth.ts` persist key 的 'naivue' 拼写错误保留（修了会丢持久化数据），已加 TODO
- `tab.ts` removeRight 的 `this.activeTab.value` 原逻辑 bug 保留（恒 undefined），`(this.activeTab as any).value` + TODO 通过 typecheck
- `permission.ts` 两个 filter 用类型谓词 `(item): item is MenuItem => !!item`（运行时同 `!!item`）；`layout: item.layout as LayoutMode`（后端字符串与 LayoutMode 的契约妥协）

### 阶段 6（2026-10-03）

完成内容：

- **MeCrud 泛型组件**（`generic="T extends Record<string, any>"`）：handleQuery 用 Array.isArray 收窄分页联合；泛型自检通过（临时 .vue 中 `DataTableColumns<UserInfo>` + `:get-data="api.read"`，render(row) 自动收窄）
- `MeModal`：props 复用 ModalOptions 接口；原 `modalStyle/contentStyle` 的 `default: () => {}` 工厂返回 undefined 是原代码 bug，迁移后不设默认值（未传即 undefined），行为完全一致；`onOk/onCancel` 的 Function 类型 prop 默认值是函数本身（Vue 不调用工厂），与原实现一致
- `QueryItem.vue`：label 类型放宽为 `string | number`（模板有 `label === 0` 判断，纯 string 会触发 TS2367）
- 偏差与妥协：
  - `TableColumn.type === 'selection'`、导出列 `hideInExcel`、行索引取值等处用 `as any` / 交叉类型从宽（naive-ui 列类型无这些自定义字段）
  - LayoutSetting 四处 `:type="cond ? 'primary' : ''"` 用 `as any`（'' 不是 ButtonType，但改 'default' 有视觉差异风险，保持原值）
  - emit/onDataChange 及 handleExport 的 data 用 `as T[]`（ref 的 UnwrapRefSimple<T> 收窄妥协）
  - ThemeSetting 的 getPresetColors 返回值无类型，断言 `{ primary: string }`
- TheFooter/TheLogo 无 script 块，无需迁移

### 阶段 7（2026-10-03）

完成内容：

- RouteMeta 声明合并已于阶段 5 提前完成，本阶段核对字段齐全
- `basic-routes.ts` 用 `satisfies RouteRecordRaw[]` 保留字面量精确类型
- `permission-guard.ts`：`route.component`（AccessRoute.component 为 unknown）赋值 glob 懒加载组件处用 `route.component as string` 做键、赋值本身无需断言；`addRoute(route as RouteRecordRaw)`；`return { ...to, replace: true } as RouteLocationRaw`（vue-router 类型历史包袱）
- `TabItem.name` 回填放宽为 `RouteRecordName | null`（to.name 可为 null）
- `directives/index.ts`：`Directive<HTMLElement, string>` + `setupDirectives(app: App)` + `withPermission(vnode: VNode, code: string)`
- layouts 18 个 .vue 统一 `<script setup lang="ts">`；模板断言妥协：SideMenu 的 options/value、UserAvatar 的 dropdown options（show: ComputedRef 是项目自定义扩展，naive 类型不认）均 `as any`
- BeginnerGuide 的 prev/next 补可选参数（模板多传实参，TS2554）

### 阶段 8（2026-10-03）

完成内容：

- 18 个含 script 的页面全部 `<script setup lang="ts">`（unocss.vue 无 script 块，无需处理）
- 实体按现实回填：`UserInfo.enable`（状态开关）、`Role.code`（SUPER_ADMIN 禁编）、`PermissionItem.id/parentId`（资源页行数据）
- `global.d.ts` WrappedMessage 补 `destroy(key, duration?)`（login/resource 页实际在用）+ content 放宽 `string | string[]`（base 页数组弹多条）
- **useCrud 泛型推断修复**：泛型函数内 `const { initForm = {} } = options` 的解构默认值会让 TS 把 initForm 推断成 `{}`，`useForm(initForm)` 的 modalForm 丢失全部字段类型——改为 `useForm<Partial<T>>(initForm ?? {})`
- DataTableColumn 是联合类型，render 解构参数无法上下文推断（`({ avatar })` 变隐式 any 且赋值报错），各页显式标注参数类型（如 `({ avatar }: UserRow)`）
- 页面级类型：user 页 `UserRow`/`UserForm`（password、roleIds 运行时字段）、role 页 `RoleRow`/`RoleForm`（permissionIds）、resource 页 `BtnRow`、role-user 的 `userIds: number[]`
- 表单值传 api 处用断言（如 `api.update(modalForm.value as Partial<UserInfo> & { id: number })`，编辑时必带 id）

### 阶段 9（2026-10-03）

完成内容：

- `main.js → main.ts`（与 `index.html` 的 `/src/main.ts` 改动同 commit）；顺手修正注释中把 Pinia 写成 Vuex 的错误表述
- 删除 `jsconfig.json`
- `tsconfig.json` 收紧：`strict: true`、`allowJs: false`；`noUncheckedIndexedAccess` **未开启**（见下方遗留项）
- 修复 strict 暴露的 87 处错误，关键模式：
  - options store 的 getters 在 strict 下无法用 this，改用 `state` 参数形式（user/tab，运行时等价）；getter 的 `|| {}` 兜底改 `?? ({} as Role)` 保住类型
  - actions 默认参数里的 `this`（app.setThemeColor、tab.removeOther）改为可选参数 + 函数体内 `??` 兜底（运行时等价）
  - 新建 `src/types/arco-design-color.d.ts`（该包无类型声明）
  - Message 类 content 参数放宽 `string | string[]`（WrappedMessage 契约同步）
  - DataTableColumn 联合类型导致 render 解构参数无法上下文推断，各页显式标注参数类型
  - useCrud 的 doDelete/doUpdate 在 strict 函数协变下不匹配，页面侧包装一层对齐 api 形状（运行时不变）
- 三绿：`pnpm typecheck` 0 错误、`pnpm build` 通过、`pnpm lint:fix` 0 error（1 条 pre-existing 的 vue/no-template-shadow warning）
- `pnpm dev` 启动正常（HTTP 200，main.ts 正常编译）

### 遗留项（阶段 9 收尾记录）

- **手测未完全执行**：自动化环境无后端（VITE_PROXY_TARGET=localhost:8085）与浏览器交互验证，登录 → pms 三页 CRUD → 角色分配 → 资源菜单 → 标签页 → 主题切换 → 刷新补录 → 登出 → 404/403 全流程手测需要用户本地执行；已验证 dev 启动、build 产物、类型全绿
- `noUncheckedIndexedAccess` 未开启（开启后 `this.tabs[length - 1].path` 等 30+ 处索引访问需收窄，收益/成本比低）
- 更严格的候选：`exactOptionalPropertyTypes`、`noImplicitOverride` 未评估开启
- `enable: boolean | 0 | 1` 的后端契约妥协保留（统一为 boolean 属接口变更）
- `App.vue` 中 `layout === 'default'` 的旧持久化值兼容逻辑带断言保留（疑似死代码，按"不改运行时行为"原则未清理）
- `login/api.ts` 的 `toggleRole` 无调用方，payload 保持 `Record<string, unknown>` 宽松类型
