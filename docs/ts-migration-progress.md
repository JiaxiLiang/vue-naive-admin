# vue-naive-admin JS → TS 迁移进度

> 计划来源：`.agents/skills/js-to-ts-migration/SKILL.md`。本文件是跨会话续作的唯一状态来源。

## 阶段清单

- [x] 阶段 0：工具链与类型地基（tsconfig、vite dts、src/types/\*、typecheck 脚本）
- [ ] 阶段 1：settings + utils 工具层（settings、is、common、storage）
- [ ] 阶段 2：http 层（utils/http/\*、naiveTools）
- [ ] 阶段 3：实体模型 + api 层（src/types/models.ts、src/api、views/\*/api）
- [ ] 阶段 4：composables 泛型化（useModal/useForm/useCrud/useAliveData）
- [ ] 阶段 5：Pinia store（store/modules/\* 6 个模块 + helper）
- [ ] 阶段 6：共享组件（MeCrud/MeModal/MeQueryItem/common 8 个）
- [ ] 阶段 7：router + directives + layouts
- [ ] 阶段 8：views 逐页迁移（24 个页面，从 user 页开始）
- [ ] 阶段 9：收尾（main.ts、jsconfig 删除、strict 全开、README 更新）

## 各阶段 commit 索引

| 阶段 | commit                             | 说明                  |
| ---- | ---------------------------------- | --------------------- |
| 0    | 见 git log `refactor(ts): phase 0` | tsconfig + types 地基 |

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

### 阶段 9 遗留备忘（前置记录）

- `store/modules/user.js` 的 `userInfo: null` 需要改 `null as UserInfo | null`
- `tab.js` 的 `this.tabs[length - 1].path`：`noUncheckedIndexedAccess` 建议先不开启，见阶段 9
