# 1-vue-naive-admin

📐 **[项目架构图全集（14 张 · 基于源码重绘）](docs/arch-overview.md)** · [整体分层架构图（可视化 HTML）](docs/architecture.html) · [Mermaid 源码](docs/architecture.md) · [CRUD 模块架构图](docs/module-architecture.md)

```
1-vue-naive-admin
├─ .editorconfig
├─ .env
├─ .env.development
├─ .env.production
├─ .npmrc
├─ build
│  ├─ index.ts
│  └─ plugin-isme
│     ├─ icons.ts
│     ├─ index.ts
│     └─ page-pathes.ts
├─ eslint.config.ts
├─ index.html
├─ LICENSE
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ public
│  └─ favicon.png
├─ src
│  ├─ api
│  │  └─ index.ts（含 createCrudApi<T, Q> CRUD 接口工厂）
│  ├─ App.vue
│  ├─ assets
│  │  ├─ icons
│  │  │  ├─ dynamic-icons.ts
│  │  │  ├─ feather（svg 图标集）
│  │  │  └─ isme（svg 图标集）
│  │  └─ images
│  ├─ components
│  │  ├─ common
│  │  │  ├─ AppCard.vue
│  │  │  ├─ AppPage.vue
│  │  │  ├─ CommonPage.vue
│  │  │  ├─ index.ts
│  │  │  ├─ LayoutSetting.vue
│  │  │  ├─ TheFooter.vue
│  │  │  ├─ TheLogo.vue
│  │  │  ├─ ThemeSetting.vue
│  │  │  └─ ToggleTheme.vue
│  │  ├─ index.ts
│  │  └─ me
│  │     ├─ crud
│  │     │  ├─ index.vue（MeCrud 泛型组件 generic="T, Q"）
│  │     │  └─ QueryItem.vue
│  │     ├─ index.ts
│  │     └─ modal
│  │        ├─ index.vue
│  │        └─ utils.ts
│  ├─ composables
│  │  ├─ index.ts
│  │  ├─ useCrud.ts（泛型 useCrud<T> + 类型守卫收窄）
│  │  ├─ useEnableRow.ts（表格行状态开关）
│  │  ├─ useForm.ts
│  │  ├─ useModal.ts
│  │  └─ useUserInfoColumns.ts（用户两页共享列）
│  ├─ directives
│  │  └─ index.ts
│  ├─ layouts
│  │  ├─ components
│  │  │  ├─ BeginnerGuide.vue
│  │  │  ├─ BreadCrumb.vue
│  │  │  ├─ Fullscreen.vue
│  │  │  ├─ index.ts
│  │  │  ├─ MenuCollapse.vue
│  │  │  ├─ RoleSelect.vue
│  │  │  ├─ SideLogo.vue
│  │  │  ├─ SideMenu.vue
│  │  │  ├─ tab
│  │  │  │  ├─ ContextMenu.vue
│  │  │  │  └─ index.vue
│  │  │  └─ UserAvatar.vue
│  │  ├─ empty
│  │  │  └─ index.vue
│  │  ├─ full
│  │  │  ├─ header
│  │  │  │  └─ index.vue
│  │  │  ├─ index.vue
│  │  │  └─ sidebar
│  │  │     └─ index.vue
│  │  ├─ normal
│  │  │  ├─ header
│  │  │  │  └─ index.vue
│  │  │  ├─ index.vue
│  │  │  └─ sidebar
│  │  │     └─ index.vue
│  │  └─ simple
│  │     ├─ index.vue
│  │     └─ sidebar
│  │        └─ index.vue
│  ├─ main.ts
│  ├─ router
│  │  ├─ basic-routes.ts（satisfies RouteRecordRaw[]）
│  │  ├─ guards
│  │  │  ├─ index.ts
│  │  │  ├─ page-loading-guard.ts
│  │  │  ├─ page-title-guard.ts
│  │  │  ├─ permission-guard.ts
│  │  │  └─ tab-guard.ts
│  │  └─ index.ts
│  ├─ settings.ts（LAYOUT_MODES as const → LayoutMode 派生 + toLayoutMode 归一）
│  ├─ store
│  │  ├─ helper.ts
│  │  ├─ index.ts
│  │  └─ modules
│  │     ├─ app.ts
│  │     ├─ auth.ts
│  │     ├─ index.ts
│  │     ├─ permission.ts
│  │     ├─ router.ts
│  │     ├─ tab.ts
│  │     └─ user.ts
│  ├─ styles
│  │  ├─ global.css
│  │  └─ reset.css
│  ├─ types
│  │  ├─ arco-design-color.d.ts
│  │  ├─ env.d.ts
│  │  ├─ global.d.ts
│  │  ├─ icons.ts（模板字面量类型 i-${string}）
│  │  ├─ me-components.ts
│  │  ├─ models.ts（实体 + 查询契约唯一来源）
│  │  ├─ router.d.ts
│  │  └─ virtual-modules.d.ts
│  ├─ utils
│  │  ├─ common.ts
│  │  ├─ http
│  │  │  ├─ helpers.ts
│  │  │  ├─ index.ts（HttpClient/ApiResult + setupHttpAuth 注入点）
│  │  │  └─ interceptors.ts（全链路 unknown 收窄）
│  │  ├─ index.ts
│  │  ├─ is.ts
│  │  ├─ naiveTools.ts
│  │  └─ storage
│  │     ├─ index.ts
│  │     └─ storage.ts（get 函数重载 + StoredEnvelope）
│  └─ views
│     ├─ base
│     │  ├─ index.vue
│     │  ├─ keep-alive.vue
│     │  ├─ test-modal.vue
│     │  ├─ unocss-icon.vue
│     │  └─ unocss.vue
│     ├─ demo
│     │  └─ upload
│     │     └─ index.vue
│     ├─ error-page
│     │  ├─ 403.vue
│     │  └─ 404.vue
│     ├─ home
│     │  └─ index.vue
│     ├─ iframe
│     │  └─ index.vue
│     ├─ login
│     │  ├─ api.ts
│     │  └─ index.vue
│     ├─ pms
│     │  ├─ resource
│     │  │  ├─ api.ts
│     │  │  ├─ components
│     │  │  │  ├─ MenuTree.vue
│     │  │  │  ├─ QuestionLabel.vue
│     │  │  │  └─ ResAddOrEdit.vue
│     │  │  └─ index.vue
│     │  ├─ role
│     │  │  ├─ api.ts
│     │  │  ├─ index.vue
│     │  │  └─ role-user.vue
│     │  └─ user
│     │     ├─ api.ts
│     │     └─ index.vue
│     └─ profile
│        ├─ api.ts
│        └─ index.vue
├─ tests（vitest：镜像 src 结构；*.test-d.ts 为类型测试）
│  ├─ composables
│  ├─ store
│  ├─ types
│  └─ utils
├─ tsconfig.json（应用源码工程，strict 全开 + noUncheckedIndexedAccess）
├─ tsconfig.node.json（构建工具链工程：vite/uno/eslint/build）
├─ tsconfig.typecheck.json（L2 类型测试工程）
├─ uno.config.ts
└─ vitest.config.ts
```

## TypeScript 说明

本项目为纯 TypeScript 项目（2026-10 完成 JS → TS 迁移并通过验收整改）。编译器强度：`strict` + `noUncheckedIndexedAccess` + `noImplicitOverride`；构建工具链（vite/uno/eslint/build）由 `tsconfig.node.json` 纳入同一 typecheck。

### 类型组织方式

| 位置                             | 内容                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/models.ts`            | 全项目唯一实体与契约定义处：`UserInfo`/`Role`/`PermissionItem` 等实体 + `PageParams`/`UserInfoQuery` 等查询契约（enable 数字契约在查询侧归一） |
| `src/types/global.d.ts`          | `window.$message/$dialog/$notification/$loadingBar` 全局声明（`WrappedMessage`/`WrappedDialog` 包装类型）                                      |
| `src/types/me-components.ts`     | `MeModal` 暴露契约（`ModalOptions`/`MeModalExposed`），useModal 与组件两端引用                                                                 |
| `src/types/router.d.ts`          | `vue-router` 的 `RouteMeta` 声明合并（title/layout/keepAlive/originPath/icon/parentKey/btns）                                                  |
| `src/types/icons.ts`             | 模板字面量类型 `` IconName = `i-${string}` ``，约束图标名以 `i-` 开头                                                                          |
| `src/types/virtual-modules.d.ts` | 自定义虚拟模块 `isme:icons`、`isme:page-pathes`                                                                                                |
| `src/types/env.d.ts`             | `.env` 环境变量类型                                                                                                                            |
| `src/utils/http/index.ts`        | `HttpClient`/`ApiResult`/`RequestConfig` + `setupHttpAuth` 注入点——响应拦截器改写了 axios 返回值形状，业务统一面向该接口                       |
| `src/api/index.ts`               | `createCrudApi<T, Q>` CRUD 工厂：四份 api 样板收敛为一处，Q 契约经 MeCrud 反向推断到页面查询框                                                 |
| `src/composables/useCrud.ts`     | 泛型 `useCrud<T>` + `MeCrud` 泛型组件（`generic="T, Q"`），页面列配置即获全链路类型推导                                                        |

### 常用命令

```bash
pnpm dev          # 启动开发服务器（默认 :3200）
pnpm typecheck    # 双工程类型检查（src + 构建工具链，strict 全开，0 错误为绿）
pnpm lint:fix     # eslint --fix（@antfu 配置 + 分层依赖方向机器化）
pnpm test         # vitest 单测（L1 纯逻辑）
pnpm test:cov     # 单测 + 覆盖率（src/utils 与 src/composables 门槛 80%）
pnpm test:type    # L2 类型契约测试（vitest --typecheck）
pnpm build        # 产物构建
```

### 分层依赖方向（eslint no-restricted-imports 机器化）

`utils ← api ← composables ← components ← views`，下层禁止反向引用上层；store 不引 UI；api 层不引 UI；views 之间禁止横向 import。规则固化在 `eslint.config.ts`，违规 import 在 lint 阶段直接报错。

### 验收与测试

- 验收协议：`.agents/skills/ts-acceptance-criteria`（四大支柱 + 整改规范）
- 验收报告：`docs/ts-acceptance-report-20261004.md`（首轮基线）与 `docs/ts-acceptance-report-20261004-r2.md`（整改后复验）
- 测试分层：L1 单测（`tests/` 镜像 `src/`）、L2 类型契约（`*.test-d.ts`）、T8 应用冒烟（dev/preview HTTP 200）、L4 功能测试（浏览器 GUI 驱动 §E 清单）

### 已登记的类型豁免（第三方类型局限）

- `src/utils/http/index.ts`：`request = createAxios() as unknown as HttpClient`——axios 方法级泛型无法表达"响应拦截器改写响应体"这一运行时事实，以自封装 HttpClient 收口
- `src/main.ts`：`setupNaiveDiscreteApi` 的 configProviderProps——naive-ui `GlobalThemeOverrides` 与 `ConfigProviderProps['themeOverrides']` 深层型变不兼容（官方已知类型缺陷）
- `src/router/guards/permission-guard.ts`：`{ ...to, replace: true } as RouteLocationRaw`——vue-router 的 RouteLocationRaw 不接受 RouteLocationNormalized 展开（官方类型缺口）
