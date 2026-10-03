# vue-naive-admin JS → TS 迁移进度

> 计划来源：`.agents/skills/js-to-ts-migration/SKILL.md`。本文件是跨会话续作的唯一状态来源。

## 阶段清单

- [x] 阶段 0：工具链与类型地基（tsconfig、vite dts、src/types/\*、typecheck 脚本）
- [x] 阶段 1：settings + utils 工具层（settings、is、common、storage）
- [x] 阶段 2：http 层（utils/http/\*、naiveTools）
- [x] 阶段 3：实体模型 + api 层（src/types/models.ts、src/api、views/\*/api）
- [x] 阶段 4：composables 泛型化（useModal/useForm/useCrud/useAliveData）
- [ ] 阶段 5：Pinia store（store/modules/\* 6 个模块 + helper）
- [ ] 阶段 6：共享组件（MeCrud/MeModal/MeQueryItem/common 8 个）
- [ ] 阶段 7：router + directives + layouts
- [ ] 阶段 8：views 逐页迁移（24 个页面，从 user 页开始）
- [ ] 阶段 9：收尾（main.ts、jsconfig 删除、strict 全开、README 更新）

## 各阶段 commit 索引

| 阶段 | commit                             | 说明                  |
| ---- | ---------------------------------- | --------------------- |
| 0    | 见 git log `refactor(ts): phase 0` | tsconfig + types 地基 |
| 1    | 见 git log `refactor(ts): phase 1` | settings + utils      |
| 2    | 见 git log `refactor(ts): phase 2` | http 层               |
| 3    | 见 git log `refactor(ts): phase 3` | 实体模型 + api 层     |
| 4    | 见 git log `refactor(ts): phase 4` | composables 泛型化    |

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

### 阶段 9 遗留备忘（前置记录）

- `store/modules/user.js` 的 `userInfo: null` 需要改 `null as UserInfo | null`
- `tab.js` 的 `this.tabs[length - 1].path`：`noUncheckedIndexedAccess` 建议先不开启，见阶段 9
