---
name: js-to-ts-migration
description: 将 vue-naive-admin 项目从 JavaScript 渐进式迁移到 TypeScript 的分阶段执行计划。包含 10 个阶段的模块级改造清单、每个文件要新增的具体类型定义（代码级）、每阶段验收标准与回滚方式。当用户提到 TS 迁移、TypeScript 改造、typecheck、tsconfig、泛型化（useCrud/MeCrud）、继续迁移、迁移进度，或要求把本项目任何 JS/Vue 文件改写成 TS 时使用。
---

# vue-naive-admin JS → TS 渐进式迁移

本项目是 Vue 3.5 + Vite 8 + Naive UI + Pinia 3 + vue-router 5 + UnoCSS 的**纯前端**项目（`src/api` 只是请求封装，后端由 vite proxy 转发），src 下约 6800 行 JS/Vue 代码。本 skill 把它整体迁移为 TS，**不新增任何功能**。

## 开始任何迁移工作前，必做三件事

1. **判断当前进度**：执行 `find src -name '*.ts' -o -name '*.vue' | xargs grep -l 'lang="ts"' 2>/dev/null` 以及检查 `docs/ts-migration-progress.md` 是否存在、git log 里的阶段 commit，确定已完成到哪个阶段。然后**只做下一个阶段**，不要跳步——后面的阶段依赖前面阶段产出的类型。
2. **读取对应参考文件**：每个阶段的文件清单、具体类型定义、易错点都写在 `references/` 里，开工前必须先读对应文件（见下方阶段总览表）。
3. **确认基线是绿的**：`pnpm dev` 能启动、`pnpm build` 能通过。若基线本身是坏的，先停下向用户说明，不要在坏基线上开始迁移。

## 目标与不变式（每个阶段都必须遵守）

- **纯等价重构**：只改类型和文件后缀，不改运行时行为。运行逻辑有变化的地方一律保持原逻辑（哪怕原逻辑有 bug，也只加 `TODO` 注释标记，不顺手修）。
- **保留注释**：项目里有大量中文学习注释，全部保留。注释里的事实性错误（如 `main.js` 把 Pinia 写成 Vuex）可以在迁移到该文件时顺手修正文字，但不许删注释。
- **依赖方向不可逆转**：utils ← composables ← components ← views。类型只允许被下层暴露给上层，上层类型不许被下层 import。
- **共享类型统一放 `src/types/`**：跨层复用的类型（`ApiResult`、实体模型、`Window` 全局声明等）不允许就近散落在业务文件里。
- **一个阶段一个 commit**：commit message 格式 `refactor(ts): phase N <阶段名>`。出问题时可按阶段回滚。
- **维护进度文档**：首次执行时创建 `docs/ts-migration-progress.md`（10 个阶段的 checkbox 清单），每完成一个阶段勾选并记录该阶段发现的遗留问题。这是跨会话续作的唯一状态来源。

## 阶段总览

| 阶段 | 内容 | 主要文件 | 参考文件 |
|---|---|---|---|
| 0 | 工具链与类型地基 | tsconfig、vite.config、src/types/* | `references/00-toolchain.md` |
| 1 | settings + utils 工具层 | settings、is、common、storage | `references/01-foundation.md` |
| 2 | http 层（类型浓度最高的底座） | utils/http/*、naiveTools | `references/01-foundation.md` |
| 3 | 实体模型 + api 层 | src/types/models.ts、src/api、views/*/api | `references/02-api-models.md` |
| 4 | composables 泛型化 | useModal/useForm/useCrud/useAliveData | `references/03-composables.md` |
| 5 | Pinia store | store/modules/* 6 个模块 + helper | `references/04-store.md` |
| 6 | 共享组件（泛型组件是重头戏） | MeCrud/MeModal/MeQueryItem/common 8 个 | `references/05-components.md` |
| 7 | router + directives + layouts | router/*、guards/*、directives、layouts 20 个 | `references/06-router-layouts.md` |
| 8 | views 逐页迁移 | 24 个页面，从 user 页开始 | `references/07-views.md` |
| 9 | 收尾：strict 全开 | main、tsconfig 收紧、全量校验 | 见本文末尾 |

## 每阶段统一的验收流程

阶段内全部文件改完后，依次执行并在任一步失败时修复后重跑：

1. `pnpm typecheck` —— 阶段 0 之后可用（`vue-tsc --noEmit`）。阶段 0~8 期间 `allowJs: true`，所以只检查已迁移的 `.ts` / `lang="ts"` 文件，历史 JS 文件报错是正常的，不算失败。
2. `pnpm build` —— 必须通过。
3. `pnpm lint:fix` —— 对本阶段改动过的文件跑一遍，消除格式问题（@antfu/eslint-config 检测到 typescript 依赖后自动启用 TS 规则）。
4. **手测**（`pnpm dev` 后在浏览器里点）：阶段对应的页面/功能必须可用。最低手测集：登录 → 首页 → 用户管理页增删改查 → 切换暗色主题 → 刷新页面（验证持久化与路由守卫补录）→ 登出。
5. 按阶段提交 commit，勾选 `docs/ts-migration-progress.md`。

## 阶段 9：收尾（详细步骤）

前面 8 个阶段完成后：

1. **迁移 `src/main.js` → `src/main.ts`**，同步把 `index.html` 里的 `/src/main.js` 改为 `/src/main.ts`（这两个改动必须同 commit，否则启动白屏）。顺便修正注释中"Vuex"的错误表述（实际是 Pinia）。
2. **删除 `jsconfig.json`**（职责已由 tsconfig 承接）。
3. **收紧 tsconfig**：`allowJs: false`；`strict: true`。逐个修复由此暴露的错误——典型位置：`store/modules/user.js` 的 `userInfo: null`（改 `null as UserInfo | null`）、`tab.js` 的 `this.tabs[length - 1].path`（`noUncheckedIndexedAccess` 下的索引访问，建议先不开启该选项，在进度文档里记录为遗留项）。
4. **全量校验**：`pnpm typecheck && pnpm build && pnpm lint:fix` 三绿。
5. **全流程手测**：完整走一遍登录 → 三个 pms 页 CRUD → 角色分配 → 资源菜单 → 标签页操作 → 主题切换 → 刷新补录 → 登出 → 404/403。
6. 更新 `README.md` 增加一节"TypeScript 迁移说明"（类型组织方式、typecheck 命令、各阶段 commit 索引）。
7. 在 `docs/ts-migration-progress.md` 记录收尾遗留项（如未开启的更严格选项、`enable: boolean | 0 | 1` 这类与后端契约的类型妥协）。

## 关键背景知识（执行者必须知道）

- **auto-import 的边界**：`ref`/`computed`/`onMounted`/`h`/`useRouter` 等由 `unplugin-auto-import` 注入（阶段 0 开启 dts 后类型自动可用）；naive-ui 组件由 `unplugin-vue-components` 按需解析（模板里直接用，类型来自 components.d.ts）；但 **naive-ui 的类型（`FormInst`、`DataTableColumns`、`GlobalThemeOverrides` 等）必须显式 `import type` from 'naive-ui'**，auto-import 不覆盖它们。
- **`$message`/`$dialog`/`$notification`/`$loadingBar`** 是运行时挂到 `window` 上的全局对象（`naiveTools.js`），代码里既有 `window.$message?.` 也有裸 `$message` 写法——阶段 0 的全局声明两种都要覆盖（`declare global` 里同时声明 `Window` 接口扩展和裸全局常量），否则全项目报错。
- **响应拦截器改变了返回值形状**：`interceptors.js` 把 axios 响应替换成了后端响应体 `{ code, message, data }`，所以 axios 自带的类型是错的。阶段 2 用自封装的 `HttpClient` 接口覆盖这一点，是整个项目类型体系的基石。
- **MeCrud 的分页契约**（来自其 props 注释）：后端分页返回 `{ pageData, total }`，非分页返回数组本身。`getData` 的类型必须是 `Promise<ApiResult<PageResult<T> | T[]>>` 这个联合，组件内用 `Array.isArray` 收窄。
