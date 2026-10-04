# vue-naive-admin TS 改造验收报告（r3 · 3a 三件套新增功能后）

- 日期：2026-10-05　执行者：ZCode（GLM），操作者复核：L+C
- 验收范围：e702dbe 全量工作区（在 r2 报告 `docs/ts-acceptance-report-20261004-r2.md` 基础上，覆盖 3a 新增功能：A2 useRequest / C3 useRouteQuery / A1 token 无感刷新）
- 基线：typecheck ✅ · build ✅ · lint ✅（仅 App.vue 既有 vue/no-template-shadow warning，r2 已登记）· test ✅ 124/124 · test:type ✅
- 总体判定：**通过**（P0 ×0 · P1 ×0（本轮发现 1 项，当场整改闭环）· P2 ×6）

本轮提交（按"一功能一 commit"）：
`0646ace` 收纳 3a skill → `5dbd0e9` A2 useRequest → `5364116` C3 useRouteQuery → `fbb0e8d` A1 token 无感刷新 → `e702dbe` C3 验收整改（replaceState）

## 判定汇总

| 支柱                 | 结果 | P0  | P1  | P2  |
| -------------------- | ---- | --- | --- | --- |
| A 无 JS 痕迹         | pass | 0   | 0   | 0   |
| B 从零构建标准       | pass | 0   | 0   | 2   |
| C 代码质量与功能保留 | pass | 0   | 0   | 2   |
| D 测试标准           | pass | 0   | 0   | 2   |

## 明细

### 支柱 A（A1–A7 全过）

- [A1] ✅ `find` 零 JS 源文件（豁免清单为空）；tsconfig.node.json 覆盖构建链 TS 配置文件
- [A2] ✅ grep 命中 4 个 .vue（TheLogo/TheFooter/layouts/empty/unocss）逐个确认均为纯模板无 `<script>` 块
- [A3] ✅ `allowJs: false, checkJs: false`；无 jsconfig.json
- [A4] ✅ 零 `@ts-nocheck`/`@ts-ignore`/`@ts-expect-error`（src/build/tests 全查）
- [A5] ✅ 零 CommonJS 残留
- [A6] ✅ index.html → `/src/main.ts`；package.json scripts 无 .js 调用
- [A7] ✅ 零 JSDoc 承担类型职责

### 支柱 B

- [B1] ✅ strict + noUncheckedIndexedAccess 全开（tsconfig.json）；exactOptionalPropertyTypes 论证不开（tsconfig 内注释 + r2 报告豁免）
- [B2] ✅ any 断言清单：`grep "as any\|: any\|<any>\|any[]"` → **0 条**
- [B3] ⚠️ 双重断言 2 处：`utils/http/index.ts:85`（r2 已登记：axios 拦截器改写响应体的类型桥接）+ `utils/http/auth-refresh.ts:86`（本轮新增，同一豁免家族：重放复用原实例 `service.request(config)` 运行时 resolve 拦截器改写后的响应体，行内注释已注明并引用 HttpClient 桥接豁免）→ 登记保留
- [B4] ✅ 模板内 `as any` → 0 条
- [B5] ✅ 三链路抽测全拦截（见下文记录），临时改动已还原，git status 干净
- [B9] ✅ 疤痕关键词（含"基线"）扫描 → 0 条；新增代码注释均为"讲为什么"的设计注释
- [B10] ✅ 本轮新增导出全部有真实调用方（useRequest/useRouteQuery：barrel+两页两 api；isAuthExpiredCode/handleTokenExpired：interceptors 双路径；skipAuthRefresh：api+http 层；api.refreshToken 死代码已激活——main.ts:40 经注入缝调用）。r2 既有"无调用导出"按项目约定为未来功能基座函数，论证保留（用户明确指示，B10 的"论证保留"通道）
- [B11] ✅ 新功能契约收口在既有单一来源：LoginToken（api.refreshToken 泛型化）、RequestConfig 扩展字段、HttpAuthHandlers 注入缝；未新增跨页重复类型
- [B12] ✅ 新代码命名与解法一致：useXxx 组合式函数、Query 契约复用 models.ts 的 UserInfoQuery/RoleQuery（顺带消除 `ref<Query>({})` 的宽松初始化）、测试与既有 spec 同风格
- [B14] ✅ 三绿在配置 TS 化链路上稳定复现

### 支柱 C

- [C1] ✅ jscpd（min-tokens 60）总重复率 0.59%：css 1（normalize 上游样板）、html 4（unocss 演示页）、typescript 1（0.46%，P2 记录）；新增代码无"仅标识符不同"克隆
- [C2] ✅ 新文件函数均 ≤60 行（auth-refresh 主函数 38 行；useRouteQuery 33 行）；文件 ≤120 行；无魔法数字（401/11007/11008 具名常量 AUTH_EXPIRED_CODES）
- [C3] ✅ 错误处理策略未变：http 层集中提示，auth-refresh 兜底复用 resolveResError，业务层零改动（A1 diff 无 views/ 变更，边界矩阵 #6 达成）
- [C4] ✅ 新增能力全部经配置/组合式函数扩展（useRequest 接 fetcher，useRouteQuery 接 initial，页面一行接入）
- [C5] ✅ 可测试性：锁与队列收在纯逻辑模块 auth-refresh.ts（依赖经既有 setupHttpAuth 注入缝可替换）；新增 24 个用例
- [C6] ✅ view→view import 扫描 0；新功能经 composables/utils 通道复用
- [C7] ✅ 依赖方向四组 grep 全空；eslint no-restricted-imports 机器化在位（本轮 utils 层新增文件未违反下层禁令——auth-refresh 仅依赖 axios 与同层 helpers/index）
- [C8] ✅ 边界矩阵第 1 格（http 异常族）新增"token 过期刷新"子格：断网/超时不变，401 双路径、11007/11008、刷新失败回退、needTip 传递、needToken:false 不触发、未注入退化、防乒乓——代码有处理 + auth-refresh.spec 9 场景佐证
- [C9] ✅ 功能保留：见"功能等价验证记录"；A1 明确遵守"不删除 handleAuthExpired 弹窗兜底"

### 支柱 D

- [T1] ✅ vitest + happy-dom + vitest.config.ts（alias @→src）+ coverage-v8；test/test:cov/test:type 三脚本在位
- [T2] ✅ L1：新增 useRequest（8 用例）/useRouteQuery（7 用例）/auth-refresh（9 场景）纯逻辑全覆盖；L2：既有 contracts.test-d.ts 通过；L4：见 T8 与 C9
- [T3] ✅ tests/ 镜像 src/ 结构（composables×3 新增、utils×1 新增），一被测文件一测试文件
- [T4] ✅ AAA 结构、全局 $message/$dialog 桩、adapter 构造响应（沿 http.spec.ts 既有模式）、受控时序 deferred（刷新门控）
- [T5] ✅ 124/124 全绿；覆盖率 src/utils+composables 合并 92.87%（门槛 80%）：useRequest 100% / useRouteQuery 100% / auth-refresh 97.14% / interceptors 94.73% / helpers 95.65%
- [T6] ✅ 与 C8 互认
- [T7] ✅ 诚信扫描（.skip/.only/expect(true)）→ 0
- [T8] ✅ dev http://localhost:3200 → 200；preview http://localhost:4173 → 200

## 类型连通抽测记录（B5）

- 链路 1（读路径）：user 页 columns render 改 `row.nmae` → `TS2339: Property 'nmae' does not exist on type 'UserRow'` ✅
- 链路 2（写路径）：useCrud `doUpdate: api.delete` → `TS2322: (id: number) => … 与 (data: Partial<UserForm> & { id: number }) => … 不兼容` ✅
- 链路 3（联合约束）：`handleOpen({ action: 123 })` → `TS2322: number 不能赋给 ModalAction | undefined` ✅（说明：ModalAction 为刻意的开放联合 `BuiltinModalAction | (string & {})`，页面扩展 'reset'/'setRole' 是设计决策，never 穷举不适用，非本项 fail）
- 三处临时改动已 `git checkout` 还原，工作区干净。

## 测试执行记录（支柱 D）

- pnpm test：✅ 16 文件 / 124 用例全绿
- pnpm test:type：✅
- pnpm test:cov：src/utils+composables 92.87%（新模块 97–100%，门槛 80%）
- T8 冒烟：dev 200 ✅ · preview 200 ✅
- L4 方式：A 浏览器 GUI 自动化（ZCode browser-use 驱动 preview 构建，后端为 .env.production 同款 apifox 云端 mock），2026-10-05 执行

## 功能等价验证记录（C9 · §E 14 组）

第 1–11 组：r2 全流程实测通过（2026-10-04，基线见 r2 报告）；本轮抽查无回归——首页加载与用户信息渲染 ✅、角色列表渲染与 SUPER_ADMIN 禁编辑/禁删 ✅、共 2 条数据分页前缀 ✅。第 12–14 组为本轮新增，逐项验证：

| #   | 功能点                | 结果                           | 证据                                                                                                                                                                                                                                                                                                     |
| --- | --------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12  | useRequest 请求标准件 | ✅（选项文本物化 ⚠️ 人工复核） | 角色页编辑弹窗权限树 14 节点渲染（GUI）；用户页分配角色弹窗打开且 `/role?enable=1` 恰好 1 次（GUI）；竞态丢弃/卸载中止/失败保 data（单测 8 场景）                                                                                                                                                        |
| 13  | 列表筛选同步 URL      | ✅                             | GUI：输入"质检"→URL `?name=%22质检%22` 即时同步且输入焦点保留（tree 请求恒 1 次=零重挂）；F5 后 URL 保留且输入框回填"质检"；干净入口下重置→URL 键被移除；`enable=0` 数字还原/`redirect` 非自有键保留（单测）                                                                                             |
| 14  | Token 无感刷新        | ✅（联调 ⚠️ mock 限制）        | 正常操作 `/auth/refresh/token` 调用恒 0（GUI 网络记录）；并发单飞/队列重放/双路径接入/skipAuthRefresh 防乒乓/needToken:false 不触发/未注入退化/兜底弹窗锁（单测 9 场景矩阵）。mock 实测无刷新接口（404）且不校验 token（坏 token 返回 200）→ GUI 层无法复现 401，机制口径如实为"完整实现 + 受控时序验证" |

## 验收发现与整改闭环

| #   | 级别         | 发现                                                                                                                                                                 | 整改                                                                                                                                                                                        |
| --- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | P1（已闭环） | C3 的 `router.replace` 写 URL 与 `App.vue:17` 的 `:key="curRoute.fullPath"` 冲突：每次筛选变化触发整页重挂载（permission/tree 重复请求、输入焦点丢失），GUI 实测发现 | `e702dbe`：改用 `router.resolve().href` + 原生 `history.replaceState`（透传 history.state），URL 可分享可刷新、零导航零重挂、不动 App.vue（零既有行为变更）；单测断言维度同步迁移，复测通过 |

## 豁免登记

| 位置                                     | 类型     | 理由                                                                                 | 结论 |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------ | ---- |
| utils/http/index.ts:85                   | 双重断言 | axios 拦截器把 AxiosResponse 改写为响应体，方法级泛型无法表达该运行时事实（r2 登记） | 保留 |
| utils/http/auth-refresh.ts:86            | 双重断言 | 同上豁免家族：重放走原实例，运行时 resolve 改写后的响应体；行内注释已引用            | 保留 |
| tsconfig exactOptionalPropertyTypes 不开 | 配置评估 | Vue/naive-ui 生态依赖"可选 prop 显式传 undefined"惯用法（r2 论证）                   | 保留 |

## 需人工复核项（P2，不阻断）

1. **MeCrud 重置后 n-input 显示残留**：重置后状态已清（URL 键移除、列表重查），但输入框显示值保留至下次交互。emit 形状 `{name: null}` 与改造前完全一致，非本轮回归，属 naive-ui Input 对 null 的渲染表现。建议人工确认是否接受或后续在 MeCrud 层改进（改 MeCrud 超出 3a 授权范围）。
2. **重置的入口态语义**：经分享链接（带筛选参数）进入时，重置回到进入时的筛选态而非全空——这是 MeCrud `initQuery`（setup 时快照）的既有语义，URL 可分享后该语义变得可感知。干净入口下重置=全空+清 URL（本轮 GUI 实测）。
3. **A1 联调限制**：apifox mock 无 `/auth/refresh/token`（404）且不校验 token（坏 token 返回 200）——刷新全链路与兜底弹窗无法在 GUI 复现，以 9 场景单测矩阵为验收依据；接入真实后端后建议按 §E-14 手测一遍（改坏 sessionStorage token → 触发列表刷新 → 观察先 refresh 后重放）。
4. **IAB 对 n-select/n-dropdown 虚拟列表的限制**（与 r2 相同处置）：下拉选项文本在该自动化浏览器中不物化，角色下拉选项内容需人工点开确认。
5. **jscpd typescript 1 处克隆**（0.46%）：位于既有代码，量级低，记录不阻断。
6. **App.vue vue/no-template-shadow warning**：r2 既有登记，未变。

## 自校准（§H）附注

2026-10-05 r3 快照：r2 时代的证据集合（.js 文件、any 群、零测试设施）已全部失效——本轮扫描复核其清零。r3 新增证据集合：auth-refresh 9 场景矩阵、useRouteQuery 7 用例（location.href 维度）、useRequest 8 用例、§E 12–14 组 GUI 记录、e702dbe 整改闭环。
