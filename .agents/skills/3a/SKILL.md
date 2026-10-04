---
name: 3a
description: vue-naive-admin 项目三件套功能扩展执行计划——A1 Token 无感刷新（激活 api.refreshToken 死代码，拦截器层锁+队列+重放）、A2 useRequest 组合式函数（loading/错误/自动取消/竞态防护标准件）、C3 useRouteQuery（列表筛选状态同步 URL，刷新/分享/回退不丢）。基于现有架构增量扩展，零新依赖，含逐功能的落点文件、实现机制、边界矩阵、验收流程与 commit 规范。当用户提到"3a、加功能、无感刷新、token 刷新、useRequest、useRouteQuery、筛选同步 URL、请求组合函数"或要求执行/继续这三个功能时使用。它是 ts-acceptance-criteria 验收协议的下游执行 skill，完成后须回填其 §E 功能清单。
---

# 3a · 三件套功能扩展（A1 无感刷新 / A2 useRequest / C3 useRouteQuery）

本项目是 Vue 3.5 + Vite 8 + Naive UI + Pinia 3 + vue-router 5 + UnoCSS 的纯前端后台，已完成 JS→TS 迁移（strict 全开）。本 skill 在**现有架构上做增量功能扩展**：不封装新组件、不引入新第三方库，只沿请求层（线 A）与状态层（线 C）延伸。

## 0. 铁律（每一步都适用）

1. **只新增，不改既有行为**：三个功能全部是增量。A1 是唯一动公共路径（拦截器）的，改造后旧的"弹窗重新登录"必须保留为刷新失败后的兜底路径，不得删除。
2. **零新依赖**：AbortController、axios `signal`、vue-router query 全是现成能力。禁止引入 vueuse 的 useRequest 或任何请求库——本功能的意义就是自己实现并讲清楚。
3. **注释风格**：src/ 的中文教学注释是项目刻意约定。新代码必须带同风格注释（讲"为什么"：为什么要有锁、为什么用 replace 不用 push），但内容必须准确，不写想当然的技术表述。
4. **一功能一 commit**：顺序 A2 → C3 → A1（由简到繁）。message 格式：`feat(composables): useRequest 异步请求标准件`、`feat(composables): useRouteQuery 筛选状态同步URL`、`feat(http): token 无感刷新（锁+队列+重放）`。
5. **开工前清基线**：工作区若有未提交改动（tab.ts / permission-guard.ts / login 拼写等历史修复），先单独 commit，三个功能必须在干净基线上开工。
6. **完成后回填**：每个功能做完，往 `.agents/skills/ts-acceptance-criteria/references/audit-playbook.md` 的 §E 功能清单追加对应条目（见各功能的"验收手测点"），保持验收协议覆盖全项目。

## 1. 开工前必读的项目事实

- **自动导入**：`ref`/`computed`/`watch`/`nextTick`/`onScopeDispose`/`h`/`useRoute`/`useRouter` 由 unplugin-auto-import 注入，**不要手写这些的 import**；但 `import type { Ref } from 'vue'` 等类型导入必须显式写。naive-ui 类型（如有）必须显式 `import type`。
- **http 层双路径**（A1 的关键背景）：token 过期会从**两条路**进来——
  - 业务码路径：`interceptors.ts` 的 `resResolve`，业务 code 不在 `[0, 200]` 时 `Promise.reject({ code, message, error })`，其中 401 / 11007 / 11008 目前交给 `helpers.ts` 的 `handleAuthExpired` 弹窗；
  - HTTP 路径：`resReject`，`status === 401` 时同样落到 `resolveResError` 的 401 分支。
  A1 两条路都要接。
- **RequestConfig 自定义字段先例**：`src/utils/http/index.ts` 的 `RequestConfig` 已有 `needToken` / `needTip`，A1 的新字段照此模式加。
- **请求实例**：`import { request } from '@/utils'`，类型是自封装 `HttpClient`（`get/post/patch/delete` 返回 `Promise<ApiResult<T>>`）。重放请求用 axios 实例的 `request(originalConfig)`（重新过拦截器）。
- **auth store**：`src/store/modules/auth.ts`，state 只有 `accessToken`，有 `setToken({ accessToken })` / `resetToken` / `logout`（= resetLoginState + toLogin）/ `toLogin`（注意：只带 query 不带当前 path）。
- **风格基线**：@antfu/eslint-config，单引号、无分号、2 空格。每个功能完成线：`pnpm typecheck && pnpm build && pnpm lint:fix` 三绿。
- **apifox mock 已知限制**（迁移期实测）：不支持写操作（返回 30001）、缺 `GET /permission/menu/validate`、忽略列表过滤参数。这些是 mock 限制，不是项目 bug。

## 2. Feature A2：useRequest 异步请求标准件

**痛点**：页面散装请求裸奔——如 `views/pms/user/index.vue:135` 的 `api.getAllRoles().then(({ data = [] }) => (roles.value = data))`：无 loading、失败静默、组件卸载后响应照样写入。

### API 设计

新建 `src/composables/useRequest.ts`：

```ts
export interface UseRequestOptions {
  /** run 新请求时中止上一个（默认 true，防竞态） */
  abortPrevious?: boolean
}

export function useRequest<T>(
  /** fetcher 接收 AbortSignal，透传给 axios 的 config.signal */
  fetcher: (signal: AbortSignal) => Promise<T>,
  options?: UseRequestOptions,
): {
  data: Ref<T | undefined>
  loading: Ref<boolean>
  error: Ref<unknown>
  run: () => Promise<T | undefined>
  cancel: () => void
}
```

### 实现机制（四个必备件）

1. **状态机**：`run()` 置 `loading=true`；成功写 `data`、失败写 `error`、finally 复位 `loading`。
2. **竞态丢弃**：模块内请求序号计数器，`run` 时 `const id = ++seq`，响应返回时 `id !== seq` 则直接丢弃不写状态。
3. **自动取消**：每次 run 新建 `AbortController`；`abortPrevious !== false` 时先 `cancel()` 上一个。`onScopeDispose(() => cancel())` 保证组件卸载自动中止。
4. **错误不重复提示**：http 层 `needTip` 默认已全局弹错（`resolveResError`），`error` ref 只记录不弹窗——这是分层约定，注释里写明。

### 落点与集成

- 新文件 + `src/composables/index.ts` barrel 追加 `export * from './useRequest'`。
- 集成点（演示，各改一处）：`views/pms/user/index.vue` 的 `getAllRoles`、`views/pms/role/index.vue` 的 `getAllPermissionTree`，原 `.then` 写法替换为 `useRequest(...).run()`。
- **禁止**顺手改 MeCrud 内部分页逻辑——它有自己的 loading 体系。

### 边界与验收手测点

- 卸载后响应到达：不写状态、无报错（console 无 Vue warning）。
- 快速连点两次 run：只有第二次的结果生效。
- 接口失败：`error` 有值、`loading` 复位、旧 `data` 不被清掉。
- §E 回填条目：「useRequest：组件卸载自动中止在途请求；连发请求只采纳最后一次结果」。

## 3. Feature C3：useRouteQuery 筛选状态同步 URL

**痛点**：列表页 `queryItems` 只活在内存——刷新丢失、链接不可分享、后退无意义。

### API 设计

新建 `src/composables/useRouteQuery.ts`：

```ts
/**
 * 把一个筛选状态对象双向同步到路由 query：
 * - 初始化：从 route.query 读参数（类型还原）合并进初始值，URL 是初始状态的唯一事实源
 * - 同步：状态变化 → router.replace 更新 URL（replace 不污染历史记录）
 * 页面侧一行接入：const queryItems = useRouteQuery({ username: '', enable: undefined })
 */
export function useRouteQuery<T extends Record<string, unknown>>(initial: T): Ref<T>
```

### 实现机制

1. **序列化**：URL query 全是字符串。写入时 `JSON.stringify(value)`；`undefined` / `null` / 空串**从 query 中删除该键**（不留 `'undefined'` 脏值）。读取时 `JSON.parse` + try/catch 兜底原始字符串——这样 number（enable=0）、boolean、string 都能无损还原。
2. **初始化**：只认 `initial` 里声明过的键（不吞无关参数），还原后 `ref({ ...initial, ...restored })`。
3. **同步方向单向**：只 `watch` 这个 ref（deep）→ `router.replace({ query: 合并后的query })`。合并时保留 route.query 里**不属于本状态**的其他键（如 redirect），只增删自己的键。不 watch route（防止守卫改 query 造成回写死循环）。
4. **MeCrud reset 联动**：`handleReset` 会 `emit('update:queryItems', 恢复初始值)`，ref 被更新 → watcher 自动把清空后的状态写回 URL。无需改 MeCrud，验证这条链路通即可。

### 落点与集成

- 新文件 + barrel 导出。
- 集成点：`views/pms/user/index.vue`、`views/pms/role/index.vue` 的 `const queryItems = ref<Record<string, any>>({})` 替换为 `useRouteQuery({...})`（按各页实际筛选项定义初始值与类型——顺带消掉 `Record<string, any>`）。
- 已知联动：登录后 redirect 回跳会带 `?redirect=xxx`，本函数不碰非自有键，天然兼容。

### 边界与验收手测点

- 筛选后 F5：条件还在、列表结果一致；`enable=0` 还原为数字 0。
- 清空筛选/点重置：URL 对应键被移除，不是残留 `enable=`。
- 复制带参 URL 到新标签页直开：列表直接是筛选后的。
- 后退键：筛选状态可回退。
- §E 回填条目：「列表筛选状态同步 URL：刷新保留、链接可分享、重置同步清 URL」。

## 4. Feature A1：Token 无感刷新（锁 + 队列 + 重放）

**痛点**：token 过期时 `helpers.ts` 的 `handleAuthExpired` 弹窗强制重新登录，用户操作被打断、表单数据丢失。目标：过期后后台自动换新 token 并重放失败请求，用户无感；只有刷新也失败才走原弹窗路径。

### 第 0 步（硬性前置）：验证 mock 刷新接口

动手前先探测 apifox mock（或本地后端）对 `GET /auth/refresh/token` 的行为：返回结构是什么、旧 token 能否换新、过期 token 调用返回什么。用 curl 或浏览器直连测。结论写入 commit 描述：
- mock 支持 → 全链路联调；
- mock 不支持 → 机制完整实现，用受控时序本地演示（临时把某个请求的过期码 mock 出来），报告/面试口径如实说"机制完整、联调受 mock 限制"。**两种情况都不阻塞开发。**

### 机制设计

新建 `src/utils/http/auth-refresh.ts`（纯逻辑模块，锁与队列收在这里，便于单测）：

```ts
let isRefreshing = false                       // 单飞锁：并发过期只触发一次刷新
let pendingQueue: Array<{
  config: InternalAxiosRequestConfig           // 原始请求配置
  resolve: (value: unknown) => void            // 重放成功后归还给原调用方
  reject: (reason?: unknown) => void
}> = []

export function handleTokenExpired(service, failedConfig): Promise<unknown> {
  // 1) 已在刷新中 → 当前请求入队挂起，返回 pending promise
  // 2) 否则加锁 → 调刷新接口（带 skipAuthRefresh 标记防自触）→
  //    成功：authStore.setToken(新token) → 逐个重放队列（更新 Authorization 后
  //          service.request(config)，重新过拦截器）→ 解锁
  //    失败：队列全部 reject → 走原 handleAuthExpired 弹窗兜底（保留，不删）→ 解锁
}
```

关键决策（注释里都要写明"为什么"）：

1. **双路径接入**：`resResolve` 的业务码分支（401 / 11007 / 11008）与 `resReject` 的 HTTP 401 分支，都改道 `handleTokenExpired`；其余错误码原样走 `resolveResError`。
2. **防死循环**：`RequestConfig` 新增 `skipAuthRefresh?: boolean`（模式照 `needToken`）；刷新请求自身必须带此标记，凡带标记的请求过期直接走兜底弹窗。
3. **重放走原实例**：`service.request(config)` 重新经过拦截器（token 注入逻辑复用 `reqResolve`），行为与首次请求完全一致。
4. **与 needTip 的关系**：无感刷新与 needTip 无关——刷新是静默的，无论 needTip 与否都先尝试刷新。
5. **models.ts**：`LoginToken` 视 mock 实测结果决定是否加 `refreshToken?: string` 字段（允许：这是新功能契约，不是改旧契约）。
6. **不改页面代码**：所有改动收敛在 `src/utils/http/` + `auth store`（如需）。这是本功能的分层卖点。
7. 范围外（报告注明即可）：多标签页共享刷新状态、定时 preemptive 刷新。

### 边界矩阵与验收手测点

| # | 场景 | 期望 |
|---|---|---|
| 1 | 一屏 5 个请求同时 401 | 刷新接口只被调 1 次；5 个请求全部拿到结果 |
| 2 | 刷新成功后的并发新请求 | 直接用新 token，不入队 |
| 3 | 刷新接口自身失败/也过期 | 队列全部 reject、走原弹窗登出、无死循环 |
| 4 | 登录接口（needToken: false）返回 401 | 不触发刷新，直接走原错误处理 |
| 5 | 刷新期间用户又点了搜索 | 新请求入队，刷新完成后一并重放 |
| 6 | 页面代码 | 零改动，diff 里不得出现 views/ 下的变更 |

手测路径：dev 起服务 → 登录 → 进用户页 → 手动把 sessionStorage 里的 token 改坏（或等 mock 过期时序）→ 触发列表刷新 → 观察网络面板：先 refresh 再重放原请求，页面无弹窗无跳转。

§E 回填条目：「Token 无感刷新：并发过期只刷新一次并重放全部失败请求；刷新失败回退弹窗登出」。

## 5. 每个功能的统一验收流程

1. 实现完成 → `pnpm typecheck && pnpm build && pnpm lint:fix` 三绿。
2. `pnpm dev` 手测该功能的"验收手测点"全过 + 原功能抽查（登录 → 列表页 CRUD → 退出，确认无回归）。
3. （推荐不强制）为纯逻辑模块补 vitest 用例：`auth-refresh` 的锁与队列、`useRouteQuery` 的序列化还原——这两块是时序/边界逻辑，最适合测试。测试设施就位后按 ts-acceptance-criteria 支柱 D 的 T3/T4 规范组织。
4. 回填 §E 清单 → 按规范 commit。

## 6. 禁止事项

- 不顺手重构无关代码；diff 与功能无关的行必须为零。
- 不动 MeCrud 内部实现（分页/loading/导出）。
- 不引入任何新依赖（含 vueuse 的请求类 hooks）。
- 不删除 `handleAuthExpired` 弹窗逻辑——它是 A1 的兜底路径。
- 不在 views/ 层写任何刷新/重试逻辑——分层是本功能的考核点。
