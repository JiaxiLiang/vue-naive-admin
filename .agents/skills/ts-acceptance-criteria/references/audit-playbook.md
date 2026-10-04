# 验收执行手册（playbook）

用法：每次验收开始前通读。所有命令在仓库根目录（Git Bash）执行；Windows 下 find/grep 用 Git Bash 自带的 GNU 版本。命令输出只摘录关键行进报告，不整段粘贴。

## §A 无 JS 痕迹（支柱 A 命令）

```bash
# A1 零 JS 源文件（预期输出为空；node_modules/dist/.git 已排除）
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.mjs" -o -name "*.cjs" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*"

# A2 全部 .vue 带 lang="ts"（预期输出为空；对输出文件逐个确认是否真无 <script> 块）
grep -rLn 'lang="ts"' src --include="*.vue"

# A3 allowJs / jsconfig
grep -n "allowJs\|checkJs" tsconfig.json ; find . -name "jsconfig.json" -not -path "*/node_modules/*"

# A4 抑制注释（预期输出为空）
grep -rn "@ts-nocheck\|@ts-ignore\|@ts-expect-error" src build vite.config.* uno.config.* eslint.config.* --include="*.ts" --include="*.vue" 2>/dev/null
grep -rn "@ts-nocheck\|@ts-ignore\|@ts-expect-error" tests test --include="*.ts" 2>/dev/null   # 测试文件允许负向断言

# A5 CommonJS 残留（预期输出为空）
grep -rn "require(\|module.exports" src build vite.config.* uno.config.* eslint.config.* 2>/dev/null

# A6 入口引用（预期：index.html 指向 /src/main.ts；scripts 无 .js 调用）
grep -n "main\." index.html ; grep -n "\.js" package.json

# A7 JSDoc 承担类型职责（抽查 @type/@typedef）
grep -rn "@type\b\|@typedef\|@param {" src --include="*.ts" --include="*.vue"
```

A1 附加核对：tsconfig（或 tsconfig.node.json）的 include 是否覆盖 vite.config.ts、uno.config.ts、eslint.config.ts、build/**/*.ts；`pnpm dev && pnpm build && pnpm lint:fix` 在配置 TS 化后仍三绿。

## §B 断言清单与类型连通抽测（支柱 B 命令：B2–B5、B7）

```bash
# B2/B3/B4 断言清单：每条输出登记到报告（file:line + 是否豁免 + 豁免理由）
grep -rn "as any\|: any\|<any>\|any\[\]\|= any\b\|any>\|AxiosError<any>" src --include="*.ts" --include="*.vue"
grep -rn "as unknown as" src --include="*.ts" --include="*.vue"
grep -rn "as any" src --include="*.vue" | grep -v "<script"   # 模板内断言单独统计
```

豁免判定规则（逐处执行）：
1. 是否第三方库类型缺陷（如 naive-ui GlobalThemeOverrides 深层型变爆栈）？→ 行内注释是否写明缺陷与 issue？两问皆是 → 登记豁免（P1 复核可避免性）。
2. 其余任何理由（"原实现如此""改了有视觉风险""vue-router 历史包袱"）→ **不构成豁免**，P0。
3. `unknown` + 收窄（类型守卫/`in`/可辨识联合）永远可行，不接受"无法表达"。

B5 类型连通抽测（做完必须还原，git status 确认干净）：
- **链路 1（用户列表页）**：`views/pms/user/index.vue` 的 columns 中，把某 `render` 回调里 `row` 的字段改成 `UserInfo` 不存在的名字（如 `row.nmae`）→ `pnpm typecheck` 必须报错。
- **链路 2（写路径）**：把 `useCrud` 调用处的 `doUpdate` 实参换成缺 `id` 的对象，或把 `api.update` 的 data 类型改宽 → typecheck 必须报错。
- **链路 3（分支穷举）**：在 http 错误处理或 ModalAction 分支新增一个字面量成员不处理 → 若无 never 穷举检查则该项 fail（B7）。

## §C 疤痕与死代码（支柱 B 命令：B9、B10）

```bash
# B9 疤痕关键词（每条命中登记：修复 or 论证为有意设计并改写措辞）
grep -rn "保持原实现\|行为不变\|迁移妥协\|基线\|老 bug\|兼容旧\|遗留\|TODO\|FIXME\|暂时\|临时" \
  src build vite.config.* uno.config.* eslint.config.* --include="*.ts" --include="*.vue"

# B10 死代码（建议引入 knip：pnpm dlx knip --include exports,types）
grep -rn "toggleRole" src   # 快照已知死代码示例
```

B9 附带核对：`docs/ts-migration-progress.md` 的"遗留项"清单逐条闭环（修复，或在报告中论证为有意设计）；验收通过后该文档应归档或删除——留着就是新的疤痕。

## §D 代码质量（支柱 C 命令：C1、C6–C8）

```bash
# C1 重复块扫描（min-tokens 60 起判；"仅标识符不同"的克隆 = 违规，必要重复白名单见 SKILL.md C1 三步法）
npx jscpd src --min-tokens 60 --reporters consoleFull

# C6/C7 依赖方向（预期输出为空）
grep -rn "from '@/views" src/views --include="*.vue" --include="*.ts" | grep -v "该页自身"   # view→view
grep -rn "from '@/components\|from '@/views" src/store           # store 不 import UI
grep -rn "from '@/components\|from 'naive-ui" src/api src/views/*/api.ts   # api 层不 import UI
grep -rn "from '@/composables\|from '@/components\|from '@/views\|@/store" src/utils   # 下层不 import 上层
```

C7 机器化核对：eslint.config.ts 中存在 `no-restricted-imports`（或 dependency-cruiser 等价物）固化上述方向，且故意写一条违规 import 能被 lint 拦下。

C5 测试核对：标准与执行统一见 §F（支柱 D），此处只核对结论——vitest 脚本存在、`pnpm test` 可跑、覆盖率达标（数据取自 §F 执行结果）。

C8 边界矩阵（每格核对"代码有处理 + 有单测"；单测证据与 T6 互认）：

| # | 类别 | 必查分支 |
|---|---|---|
| 1 | http 异常族 | 断网/超时、非 JSON 响应、HTTP 401/403/500、业务 code!==200、needTip 开关、token 过期刷新 |
| 2 | 路由守卫 | 权限接口挂掉的兜底、无权限跳转、刷新后路由补录失败、外链白名单 |
| 3 | tab store | 关到只剩最后一个、removeLeft/Right/Other 越界、重复 tab、activeTab 越界 |
| 4 | useCrud/MeModal | modal 未挂载即 open、连点保存（okLoading）、validation 失败路径、无 refresh 回调、空 id 删除 |
| 5 | storage | JSON 损坏、空值、过期键、localStorage 被禁用 |
| 6 | MeCrud | columns 为空、pageData 空/缺、非分页数组、无 selection 列、导出空数据 |
| 7 | 表单 | 校验失败路径、rules 覆盖缺失字段、重置、异步校验 |
| 8 | 路由级 | 404/403、iframe 外链加载失败、菜单树为空 |

## §E 功能等价红线（支柱 C9 清单）

本清单是"原项目全部功能"的**下限**（由迁移验收的全流程实测记录沉淀）：清单之外原项目存在的行为同样不得改变。验收时逐项实测必须全过；整改后再跑必须仍全过、行为逐项一致。判定规则：任何一项功能被省略、删除、简化或行为变化 = P0，总体不通过——对代码唯一允许做的事是 TS 化与等价重构。整改清单中每个 C1–C8 条目须标注其"验证手测点"（对应下表编号）。执行方式（自动化/人工）见 §F 的 L4 协议。

后端可用 `.env.production` 同款 apifox 云端 mock 或本地后端；apifox mock 不支持写操作（返回 30001）、缺 `GET /permission/menu/validate`、忽略列表过滤参数——此三项为 mock 环境限制，不算项目缺陷。

| # | 功能点 | 核对内容 |
|---|---|---|
| 1 | 登录 | 账号密码登录、验证码加载/点击刷新/错误后刷新、记住我（重启浏览器回填）、一键体验、回车提交、失败提示 |
| 2 | 首页 | 两张 ECharts 图表正常渲染 |
| 3 | 用户管理 | 列表分页、用户名/性别/状态搜索、重置、新增（必填校验）、编辑、删除（确认框）、状态开关（含 loading 态）、分配角色、重置密码、导出 Excel、无权限按钮被移除（v-permission） |
| 4 | 角色管理 | CRUD 全套、SUPER_ADMIN 禁编辑/禁删、权限树勾选保存、分配用户跳转 |
| 5 | 角色用户 | 批量授权/取消授权、单行授权/取消、按角色查询 |
| 6 | 资源管理 | 菜单树选择与搜索、详情展示、菜单新增/编辑/删除、按钮权限增删改、图标下拉、组件路径下拉 |
| 7 | 个人资料 | 修改密码、修改头像（在线链接）、修改资料并回填 |
| 8 | 标签页 | 新增/单关/关闭其他/关闭左侧/关闭右侧/刷新（keepAlive 失效重载）、右键菜单、点击切换路由 |
| 9 | 主题 | 暗黑切换（含视图过渡动画）、主题色修改（CSS 变量联动）、四种布局切换、刷新后持久化 |
| 10 | 路由权限 | 刷新后路由补录、无 token 跳登录且登录后 redirect 回跳、已登录访问 /login 跳首页、403/404、外链内嵌 iframe 与新窗打开二选一、菜单折叠 |
| 11 | 其他 | KeepAlive 演示、上传演示、新手引导、切换角色（RoleSelect） |
| 12 | useRequest 请求标准件（3a-A2 新增） | user/role 页下拉与权限树走 useRequest：组件卸载自动中止在途请求；连发请求只采纳最后一次结果；失败时 error 有值、loading 复位、旧 data 不被清 |
| 13 | 列表筛选同步 URL（3a-C3 新增） | user/role 页筛选状态经 useRouteQuery 双向同步：筛选后刷新/分享直开条件保留（enable=0 数字还原）；重置同步清 URL（无残留脏键）；非自有 query 键（redirect）不受影响 |

## §F 测试标准与执行（支柱 D 命令与协议）

### F1 设施与命令（T1/T3/T5/T7）

```bash
# T1 设施核对（预期：三个 test 脚本齐全 + vitest 配置存在 + coverage/环境依赖在 devDeps）
grep -n '"test' package.json ; ls vitest.config.* 2>/dev/null
grep -n '"vitest\|@vitest/coverage\|happy-dom\|jsdom' package.json

# T3 组织一致性（预期：全部测试文件落在同一种策略下，无散落、无混用）
find tests src -name "*.spec.ts" -o -name "*.test-d.ts" 2>/dev/null | grep -v node_modules

# T5 执行（全绿为验收前提；type 测试用 vitest --typecheck）
pnpm test
pnpm test:type
pnpm test:cov   # 记录 src/utils 与 src/composables 行覆盖率（门槛 80%）

# T7 诚信扫描（预期输出为空）
grep -rn "\.skip(\|\.only(\|expect(true)\|xit(\|xdescribe(" tests --include="*.ts" 2>/dev/null
```

### F2 必测对象清单（T2-L1，缺一 = P1）

- `utils/is.ts`——每个类型谓词的正例 + 反例。
- `utils/common.ts`——throttle/debounce 的首次/节流窗口边界、formatDateTime 空值兜底、sleep。
- `utils/storage/storage.ts`——set/get、过期键、损坏 JSON、remove/clear、默认值分支。
- `utils/http/helpers.ts` + `interceptors.ts`——成功放行、业务码失败 reject 形状、HTTP 401/403/500、断网、needTip 开关、handleAuthExpired 防重复弹窗锁。
- `utils/naiveTools.ts`——Message 类的 key 复用/数组批量/延时销毁；setupDialog 的 confirm/cancel 回调透传。
- `composables/useCrud`——状态机（add/edit/view）、非 add/edit 守卫分支、okLoading 置位与复位、空 id 删除守卫。
- `composables/useForm`、`useModal`、`useAliveData`——各自契约（validation 返回、未挂载 setter 行为、key 归一化）。
- `store/modules/tab`——addTab 重复替换、removeTab 关到最后一个、removeLeft/Right/Other 越界。
- `store/modules/permission`——generateRoute/getMenuItem 纯计算（外链改写、按钮提取、隐藏菜单返回 null）。
- `settings.ts`——静态数据形状用 satisfies 校验的类型测试。

### F3 类型测试（T2-L2，`*.test-d.ts` + expectTypeOf，缺一 = P1）

- MeCrud 的 `PageResult<T> | T[]` 经 Array.isArray 收窄后 tableData 为 `T[]`。
- `useForm<Partial<T>>` 返回的 formModel 字段推导正确（取不存在字段必须报错）。
- HttpClient `get<T>`/`post<T>` 泛型传递到 `res.data`。
- CRUD 工厂（若 C1 整改落地 `createCrudApi<T>`）的返回类型与各页 api 等价。

### F4 L4 全链路功能测试执行协议（T2-L4，服务 C9 红线）

- **方式 A（优先）浏览器 GUI 自动化**：启动 `pnpm dev`（或 `pnpm preview`），用 Playwright（或 ZCode 会话内的 browser-use 工具）按 §E 11 组逐项驱动——真实输入、点击、断言（关键断言落 DOM 文本/网络结果，不只截图）；每组结果登记 ✅/❌ 与证据（断言输出或截图路径）。整改后回归：全部 §E 组 + 本轮整改条目的验证手测点。
- **方式 B 人工手测**：按 §E 逐项执行并登记；报告注明执行人、日期、环境（dev/preview + 后端类型）。
- 后端：本地后端或 `.env.production` 同款 apifox 云端 mock；mock 只读限制（写操作返回 30001、缺 validate 接口、忽略过滤参数）为环境限制，不算项目缺陷。

### F5 T8 应用冒烟协议

```bash
pnpm dev &        # 等待就绪（输出 Local: http://localhost:3200/）
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3200/    # 预期 200

pnpm build && (pnpm preview &) &   # 等待就绪（默认 http://localhost:4173/）
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/    # 预期 200
```

端口以命令实际输出为准；两处 200 = 冒烟通过。dev 起不来或 preview 404/500 = P0。

## §固定抽样表（支柱 B/C 人工项统一使用，保证可复现）

| 模块 | 必读文件（每模块 2 个） |
|---|---|
| 类型地基 | src/types/models.ts、src/types/router.d.ts |
| settings | src/settings.ts |
| is / common | src/utils/is.ts、src/utils/common.ts |
| storage | src/utils/storage/storage.ts |
| http | src/utils/http/index.ts、src/utils/http/interceptors.ts |
| naiveTools | src/utils/naiveTools.ts |
| api 层 | src/api/index.ts、src/views/pms/user/api.ts |
| composables | src/composables/useCrud.ts、src/composables/useForm.ts |
| store | src/store/modules/app.ts、src/store/modules/tab.ts |
| me 组件 | src/components/me/crud/index.vue、src/components/me/modal/index.vue |
| common 组件 | src/components/common/ThemeSetting.vue、LayoutSetting.vue |
| router | src/router/basic-routes.ts、src/router/guards/permission-guard.ts |
| layouts | src/layouts/components/SideMenu.vue、src/layouts/components/tab/index.vue |
| views | src/views/pms/user/index.vue、src/views/pms/resource/index.vue |
| 构建链 | vite.config.ts、build/plugin-isme/index.ts |

## §报告模板

报告保存为 `docs/ts-acceptance-report-YYYYMMDD.md`：

```markdown
# vue-naive-admin TS 改造验收报告

- 日期：YYYY-MM-DD　执行者：<模型/人>
- 基线：typecheck ✅/❌ · build ✅/❌ · lint ✅/❌ · test ✅/❌ · test:type ✅/❌
- 总体判定：**通过 / 有条件通过 / 不通过**（P0 ×N · P1 ×N · P2 ×N）

## 判定汇总
| 支柱 | 结果 | P0 | P1 | P2 |
|---|---|---|---|---|
| A 无 JS 痕迹 | pass/fail | | | |
| B 从零构建标准 | pass/fail | | | |
| C 代码质量与功能保留 | pass/fail | | | |
| D 测试标准 | pass/fail | | | |

## 明细
<!-- 每条：[编号] ✅/❌/⚠️需人工复核 + 级别 + 证据（file:line 或命令输出关键行） -->
### 支柱 A
- [A1] ❌ P0 — 证据：…
### 支柱 B
- [B2] …（附 any 清单统计：总数 / 已豁免 / 未豁免）
### 支柱 C
- [C1] …
### 支柱 D
- [T1] …

## 类型连通抽测记录（B5）
- 链路 1：… → vue-tsc 报错符合预期 ✅ / 未拦截 ❌（临时改动已还原，git status 干净）

## 测试执行记录（支柱 D）
- pnpm test：✅/❌（N passed / N failed）
- pnpm test:type：✅/❌
- pnpm test:cov：src/utils XX% · src/composables XX%（门槛 80%）
- T8 冒烟：dev ✅/❌ · preview ✅/❌
- L4 功能测试方式：A 浏览器 GUI 自动化 / B 人工（注明执行人、日期、环境）

## 功能等价验证记录（C9）
- §E 清单 11 组：逐项 ✅/❌（或引用最近一次全量验证：日期 + 基线 commit）

## 豁免登记
| 位置 | 类型（any/双重断言/@ts-expect-error） | 理由 | 结论（保留/可避免） |
|---|---|---|---|

## 整改清单（按 P0→P1 排序）
| # | 级别 | 问题 | 证据 | 建议方案（一句话） | 验证手测点（§E 编号） |
|---|---|---|---|---|---|

## 需人工复核项
- …（说明原因与建议复核方式）
```

## §H 自校准清单（2026-10-04 r2 快照 · 首轮整改后）

> 历史快照（首轮验收前，含 8 个 .js、≈49 处 any、零测试设施等 13 条证据）已归档于 `docs/archive/ts-migration-progress-20261003.md` 同期的首轮报告 `docs/ts-acceptance-report-20261004.md`。整改后（r2）的复验扫描**必须**能重新发现以下"达标证据"；一条都对不上说明扫描没跑对，先修扫描。

1. **A1**：仓库零 .js 源文件（find 输出为空）；根目录为 `vite.config.ts`/`uno.config.ts`/`eslint.config.ts`/`vitest.config.ts` + `build/**/*.ts`；typecheck 为双工程（`vue-tsc --noEmit && vue-tsc --noEmit -p tsconfig.node.json`）。
2. **B2**：`grep -rn "as any|: any|<any>|AxiosError<any>" src` 输出为**空**。
3. **B3**：`as unknown as` 仅 1 处（http/index.ts request 桥接，登记豁免）；模板内 as any 为空；`@ts-ignore/@ts-nocheck/@ts-expect-error` 为空。
4. **B1**：tsconfig 开启 `strict + noUncheckedIndexedAccess + noImplicitOverride`；exactOptionalPropertyTypes 注释论证不开。
5. **B10**：首轮 17 个死导出 + useAliveData + login/api toggleRole、getUser 均已删除；其中 is/common/storage 三模块的 17 项经**用户决策（2026-10-04）恢复为预置工具底座**（isNumber/isBoolean/isDate/isRegExp/isPromise/isElement/isWindow/isEmpty/ifNull/isUrl/isServer/isClient、debounce/formatDate/useResize、createSessionStorage/sStorage，见 r2 报告附录）——恢复项以 tests/ 单测为消费方，grep src 调用方为 0 属预期；其余（useAliveData、mockRequest、toggleRole、login getUser、getComponents）保持删除，grep 定义应为空。
6. **B9**：疤痕关键词扫描仅剩"论证保留"类（auth.ts 'naivue' 键、App.vue LEGACY_LAYOUT_VALUES——均为有意设计措辞，无 TODO/FIXME）；`docs/ts-migration-progress.md` 已归档至 docs/archive/。
7. **C1/B11**：`createCrudApi<T, Q>` 存在于 src/api/index.ts；查询契约 PageParams/EnabledQuery/UserInfoQuery/RoleQuery 收口 models.ts。
8. **C7**：eslint.config.ts 含 no-restricted-imports 分层规则；故意在 src/utils 下写 `import { useAppStore } from '@/store'` 必须 lint 报错（验证后删除）。
9. **C5/T1**：package.json 具备 test/test:cov/test:type；tests/ 镜像 src 结构，80 L1 用例 + 6 L2 用例全绿；覆盖率 ≥80%（实测 89.31%）。
10. **B12**：ContextMenu/QuestionLabel 为类型式 defineProps；useCrud doUpdate 必带 id；页面侧无 `as Partial<X> & { id: number }` 式契约抹平断言（仅 resetPwd/setRole 两处"校验保证"事实断言）。
11. **T8/C9**：dev/preview 双 200；§E 11 组浏览器 GUI 复验记录在 `docs/ts-acceptance-report-20261004-r2.md`（IAB 对 n-dropdown select 交互的限制已注明，需人工复核两项）。
