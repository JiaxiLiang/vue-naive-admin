# 1-vue-naive-admin

📐 **[项目架构图全集（14 张 · 基于源码重绘）](docs/arch-overview.md)** · [整体分层架构图（可视化 HTML）](docs/architecture.html) · [Mermaid 源码](docs/architecture.md) · [CRUD 模块架构图](docs/module-architecture.md)

```
1-vue-naive-admin
├─ .editorconfig
├─ .env
├─ .env.development
├─ .env.production
├─ .npmrc
├─ .VSCodeCounter
│  └─ 2026-06-16_20-31-00
│     ├─ details.md
│     ├─ diff-details.md
│     ├─ diff.csv
│     ├─ diff.md
│     ├─ diff.txt
│     ├─ results.csv
│     ├─ results.json
│     ├─ results.md
│     └─ results.txt
├─ build
│  ├─ index.js
│  └─ plugin-isme
│     ├─ icons.js
│     ├─ index.js
│     └─ page-pathes.js
├─ eslint.config.js
├─ index.html
├─ jsconfig.json
├─ LICENSE
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ public
│  └─ favicon.png
├─ src
│  ├─ api
│  │  └─ index.js
│  ├─ App.vue
│  ├─ assets
│  │  ├─ icons
│  │  │  ├─ dynamic-icons.js
│  │  │  ├─ feather
│  │  │  └─ isme
│  │  └─ images
│  ├─ components
│  │  ├─ common
│  │  │  ├─ AppCard.vue
│  │  │  ├─ AppPage.vue
│  │  │  ├─ CommonPage.vue
│  │  │  ├─ index.js
│  │  │  ├─ LayoutSetting.vue
│  │  │  ├─ TheFooter.vue
│  │  │  ├─ TheLogo.vue
│  │  │  ├─ ThemeSetting.vue
│  │  │  └─ ToggleTheme.vue
│  │  ├─ index.js
│  │  └─ me
│  │     ├─ crud
│  │     │  ├─ index.vue
│  │     │  └─ QueryItem.vue
│  │     ├─ index.js
│  │     └─ modal
│  │        ├─ index.vue
│  │        └─ utils.js
│  ├─ composables
│  │  ├─ index.js
│  │  ├─ useAliveData.js
│  │  ├─ useCrud.js
│  │  ├─ useForm.js
│  │  └─ useModal.js
│  ├─ directives
│  │  └─ index.js
│  ├─ layouts
│  │  ├─ components
│  │  │  ├─ BeginnerGuide.vue
│  │  │  ├─ BreadCrumb.vue
│  │  │  ├─ Fullscreen.vue
│  │  │  ├─ index.js
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
│  ├─ main.js
│  ├─ router
│  │  ├─ basic-routes.js
│  │  ├─ guards
│  │  │  ├─ index.js
│  │  │  ├─ page-loading-guard.js
│  │  │  ├─ page-title-guard.js
│  │  │  ├─ permission-guard.js
│  │  │  └─ tab-guard.js
│  │  └─ index.js
│  ├─ settings.js
│  ├─ store
│  │  ├─ helper.js
│  │  ├─ index.js
│  │  └─ modules
│  │     ├─ app.js
│  │     ├─ auth.js
│  │     ├─ index.js
│  │     ├─ permission.js
│  │     ├─ router.js
│  │     ├─ tab.js
│  │     └─ user.js
│  ├─ styles
│  │  ├─ global.css
│  │  └─ reset.css
│  ├─ utils
│  │  ├─ common.js
│  │  ├─ http
│  │  │  ├─ helpers.js
│  │  │  ├─ index.js
│  │  │  └─ interceptors.js
│  │  ├─ index.js
│  │  ├─ is.js
│  │  ├─ naiveTools.js
│  │  └─ storage
│  │     ├─ index.js
│  │     └─ storage.js
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
│     │  ├─ api.js
│     │  └─ index.vue
│     ├─ pms
│     │  ├─ resource
│     │  │  ├─ api.js
│     │  │  ├─ components
│     │  │  │  ├─ MenuTree.vue
│     │  │  │  ├─ QuestionLabel.vue
│     │  │  │  └─ ResAddOrEdit.vue
│     │  │  └─ index.vue
│     │  ├─ role
│     │  │  ├─ api.js
│     │  │  ├─ index.vue
│     │  │  └─ role-user.vue
│     │  └─ user
│     │     ├─ api.js
│     │     └─ index.vue
│     └─ profile
│        ├─ api.js
│        └─ index.vue
├─ uno.config.js
└─ vite.config.js

```

## TypeScript 迁移说明

本项目已整体从 JavaScript 迁移到 TypeScript（2026-10 完成，渐进式 10 阶段）。

### 类型组织方式

| 位置                             | 内容                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/types/models.ts`            | 全项目唯一实体定义处：`UserInfo`/`Role`/`PermissionItem`/`MenuItem`/`PageResult`/`AccessRoute` 等跨层共享模型    |
| `src/types/global.d.ts`          | `window.$message/$dialog/$notification/$loadingBar` 全局声明（`WrappedMessage`/`WrappedDialog` 包装类型）        |
| `src/types/me-components.ts`     | `MeModal` 暴露契约（`ModalOptions`/`MeModalExposed`），useModal 与组件两端引用                                   |
| `src/types/router.d.ts`          | `vue-router` 的 `RouteMeta` 声明合并（title/layout/keepAlive/originPath/icon/parentKey/btns）                    |
| `src/types/virtual-modules.d.ts` | 自定义虚拟模块 `isme:icons`、`isme:page-pathes`（均为 `string[]`）                                               |
| `src/types/env.d.ts`             | `.env` 环境变量类型                                                                                              |
| `src/utils/http/index.ts`        | `HttpClient`/`ApiResult`/`RequestConfig`——响应拦截器改写了 axios 返回值形状，业务统一面向该接口                  |
| `src/composables/useCrud.ts`     | 泛型 `useCrud<T>` + `MeCrud` 泛型组件（`generic="T"`），页面声明 `DataTableColumns<UserInfo>` 即获全链路类型推导 |

### 常用命令

```bash
pnpm typecheck   # vue-tsc --noEmit（strict 全开，0 错误为绿）
pnpm lint:fix    # eslint --fix（@antfu 配置，自动启用 TS 规则）
pnpm build       # 产物构建
```

### 迁移阶段索引

迁移按 10 个阶段推进，每阶段一个 commit（`refactor(ts): phase N ...`），可按阶段回溯：
阶段 0 工具链与类型地基 → 1 settings/utils → 2 http 层 → 3 实体模型 + api → 4 composables 泛型化 → 5 Pinia store → 6 共享组件（泛型 MeCrud）→ 7 router/directives/layouts → 8 views 逐页 → 9 收尾（main.ts、jsconfig 删除、strict 全开）。
各阶段详细决策与遗留妥协见 [docs/ts-migration-progress.md](docs/ts-migration-progress.md)。

### 已知类型妥协（运行时行为均未改动）

- naive-ui 的 `GlobalThemeOverrides` 与 `ConfigProviderProps['themeOverrides']` 存在深层型变不兼容（官方已知缺陷），`app store` 的 persist 配置与 `setupNaiveDiscreteApi` 处用断言绕过
- `AccessRoute.component` 在 store 阶段是后端字符串路径，permission-guard 中才替换为懒加载组件，类型为 `unknown`
- `enable` 在查询条件里是 1/0 数字、在行数据开关里是 boolean，与后端契约保持宽松（TODO 统一属接口变更，超出本次范围）
