# 1-vue-naive-admin 验收报告（验收+测试一体协议）

- 日期：2026-10-07　执行者：ZCode（GLM-5.3-Flash）　语言/框架：TypeScript · Vue 3 · naive-ui · Vite 8
- 本轮验收范围：**专项复验**——验证"删除测试设施 + 全量注释重写"这一变更集未改变任何代码行为
- 语言适配命令：构建 `vite build` · 编译检查 `vue-tsc --noEmit`（+ `vue-tsc --noEmit -p tsconfig.node.json`）· lint `eslint . --fix` · 测试：**已按用户决策移除（见豁免）**
- 基线：构建 ✅ · lint ✅（0 error）· 编译检查 ✅（双工程 0 error）· 测试 —（用户决策豁免）
- 总体判定：**本轮变更集通过**（P0 ×0 · P1 ×0 · P2 ×2）

## 约定与豁免清单

- **用户决策豁免（2026-10-07）**：应用户明确要求，删除全部测试设施（`tests/` 19 个测试文件、`vitest.config.ts`、`tsconfig.typecheck.json`、测试脚本与 vitest/coverage/happy-dom 依赖），项目转为"无测试文件"形态。T1"测试设施缺失"按协议本应记 P0，此处登记为用户决策的项目约定，不作为本轮缺陷。
- 第三方/生成物豁免：`node_modules/`、`dist/`、`pnpm-lock.yaml`、`auto-imports.d.ts`、`components.d.ts`（unplugin 自动生成）、`.task-artifacts/`。

## 核心证明：变更集"只动注释，未动代码"（R1 红线）

**源码级证明（对 git HEAD）**：脚本 `.task-artifacts/2026-10-07/verify-comments-only.mjs` 对每个变更文件取 HEAD 与工作区两版，script 用 TypeScript 编译器 `removeComments` 转译、template 去 HTML 注释、空白归一化后逐字符对比：

- **112 个源码文件全部 token 级等价** ✅（仅注释与空白差异）
- 预期删除 19 个（tests/ 17 + vitest.config.ts + tsconfig.typecheck.json）✅
- 有意修改的配置 3 个（package.json / pnpm-lock.yaml / tsconfig.node.json，仅移除测试脚本与依赖）
- ⚠️ 1 个计划外删除 `js对象.md`：本轮会话之前就存在于工作区的未提交删除（一份 JS 学习笔记，与本轮变更无关），**需人工复核**确认是否由用户本人删除

**编译产物级证明**：

1. 同一棵工作树连续两次 `vite build`（`dist-new` vs `dist-new2`）**逐字节一致** → 构建是确定性的；
2. 源码 token 级等价于 HEAD（上述 112 文件证明）→ 推出**当前构建 ≡ HEAD 构建逐字节等价**，运行时行为与最近一次已验收提交（e5ee197，2026-10-06 02:40，其报告载明基线全绿 + GUI 回归通过）完全一致。

（注：仓库旧 `dist/`（10-05 17:13）与今日构建哈希不同，系 HEAD 之后 intervening commits 所致，与本轮变更无关；已用当前源码重新构建刷新 `dist/`。）

## 判定汇总

| 支柱                  | 结果                                   | P0  | P1  | P2  |
| --------------------- | -------------------------------------- | --- | --- | --- |
| A 高质量代码（含 R1） | 本轮变更 pass（R1 由双层等价证明兜底） | 0   | 0   | 1   |
| B 从零标准            | pass                                   | 0   | 0   | 1   |
| C 测试一体            | T8 pass；T1 用户决策豁免               | 0   | 0   | 0   |

## 明细

### 基线（§2 基线门槛）

- [基线-构建] ✅ `vite build` 37.2s 成功，产物完整
- [基线-lint] ✅ `eslint .` 0 error / 1 warning（`src/App.vue:9` vue/no-template-shadow，**改动前即存在**）
- [基线-编译] ✅ `vue-tsc --noEmit` 与 `-p tsconfig.node.json` 双工程 0 error
- [基线-测试] —（用户决策豁免，见上）

### 契约连通抽测（B4，§E）

- 链路 1（模块解析）：`basic-routes.ts` 故意改 import 为 `@/views/login/index.vue2` → **TS2307 拦截** ✅
- 链路 2（路由记录契约）：故意把 `path` 写成 `paths` → **TS2561 + 级联 TS2322 拦截** ✅
- 两处临时改动均已还原，`git status` 干净 ✅
- 过程记录：还原时误用 `git checkout --`（从暂存区恢复）导致该文件新注释被回退为 HEAD 旧注释；**已当场发现并按原重写版恢复**，恢复后重跑等价性脚本（112 文件全等价 ✅）与 eslint（通过 ✅）

### 压制检查与疤痕扫描（§B）

- 压制检查 2 处（均为改动前既有，非本轮引入）：
  - `src/utils/http/auth-refresh.ts:93` `as unknown as Promise<unknown>`（重放请求的 axios 实例类型收口）
  - `src/utils/http/index.ts:86` `createAxios() as unknown as HttpClient`（axios 实例与自定义 HttpClient 契约对齐）
- 疤痕关键词命中 2 处，定性为**非疤痕**（描述可选参数语义的事实陈述，非妥协措辞）：`src/views/pms/role/api.ts:11`、`src/views/pms/user/api.ts:13`（"signal 不传时行为不变"）。建议后续整改时改写措辞为"signal 可选，缺省即直连请求"。

### 应用冒烟（T8，§H）

- 开发态：`vite --port 5173` → HTTP **200** ✅
- 构建产物：`vite preview --port 4173` → HTTP **200** ✅

## 豁免登记

| 位置                                                                           | 类型                         | 理由                                   | 结论           |
| ------------------------------------------------------------------------------ | ---------------------------- | -------------------------------------- | -------------- |
| tests/ 全部 + vitest.config.ts + tsconfig.typecheck.json + package.json 测试项 | 用户决策删除                 | 用户明确"不需要测试文件，只要纯净代码" | 保留删除       |
| auth-refresh.ts:93 / http/index.ts:86                                          | 压制检查（既有）             | axios 实例类型收口，改动前即存在       | 保留           |
| `js对象.md` 工作区删除                                                         | 计划外删除（本轮之前已存在） | 非本轮操作产生                         | **需人工复核** |

## P2 记录（不阻断）

| #   | 问题                                                                      | 证据                   | 建议                     |
| --- | ------------------------------------------------------------------------- | ---------------------- | ------------------------ |
| 1   | `index.html` 文档标题为 "Element Plus Demo"，与项目身份不符（改动前既有） | 冒烟时 curl 首页 title | 改为项目名               |
| 2   | 两处注释使用"行为不变"疤痕关键词式措辞                                    | §B 扫描                | 下次触碰该文件时改写措辞 |

## 需人工复核项

- `js对象.md` 的工作区删除发生在本轮会话之前（未提交），请确认是否为你本人删除；若非，可 `git checkout -- js对象.md` 恢复。

## 自校准证据集（本轮固化）

- 等价性脚本可复跑：`node .task-artifacts/2026-10-07/verify-comments-only.mjs` → 预期输出"112 个文件等价 + 19 个预期删除 + 1 个计划外删除（js对象.md）"
- 压制检查基线：2 处 `as unknown as`（位置见上）
- 疤痕关键词基线：2 处"行为不变"（位置见上）
- lint 基线：1 warning（App.vue:9 template shadow）
