# vue-naive-admin TS 改造验收报告（首轮）

- 日期：2026-10-04　执行者：ZCode（GLM）
- 依据：`.agents/skills/ts-acceptance-criteria`（SKILL.md + audit-playbook + module-checklist）
- 基线：typecheck ✅（0 错误）· build ✅（5.09s）· lint:fix ✅（0 error / 1 warning）· test ❌（无设施）· test:type ❌（无设施）
- 总体判定：**不通过**（P0 ×8 · P1 ×14 · P2 ×4）——用户已明确指示"不达标的部分直接按照标准进行修改"，验收后进入整改模式（§7），整改完成后产出 r2 复验报告，本报告保留作对照。

## 判定汇总

| 支柱                 | 结果 | P0  | P1  | P2  |
| -------------------- | ---- | --- | --- | --- |
| A 无 JS 痕迹         | fail | 1   | 0   | 1   |
| B 从零构建标准       | fail | 4   | 7   | 2   |
| C 代码质量与功能保留 | fail | 2   | 4   | 0   |
| D 测试标准           | fail | 2   | 4   | 0   |

## 明细

### 支柱 A

- [A1] ❌ P0 — 8 个 .js 源文件：`vite.config.js`、`uno.config.js`、`eslint.config.js`、`build/index.js`、`build/plugin-isme/{index,icons,page-pathes}.js`、`src/assets/icons/dynamic-icons.js`（§H 自校准第 1 条全部命中）。**附加违规**：tsconfig 无 tsconfig.node.json，构建配置全部处于类型盲区（违反 A1 附加核对）。
- [A2] ✅ — 4 个无 `lang="ts"` 的 .vue（TheFooter/TheLogo/layouts/empty/unocss）经 `grep -c "<script"` 确认均无 script 块，本身合规。
- [A3] ✅ — `allowJs: false, checkJs: false`；无 jsconfig.json。
- [A4] ✅ — 零 `@ts-nocheck/@ts-ignore/@ts-expect-error`。
- [A5] ✅ — 零 CommonJS 残留。
- [A6] ✅ — index.html 指向 `/src/main.ts`；package.json scripts 无 .js 调用。
- [A7] ⚠️ P2 — `directives/index.ts:23-24` JSDoc `@param {*}` 为说明性文档（真实类型在函数签名上），不构成"JSDoc 承担类型职责"；但 `{*}` 措辞属 JS 时代残留，整改为具名类型描述。

### 支柱 B

- [B1] ❌ P0 — `noUncheckedIndexedAccess` 未开启（tsconfig.json 无此字段）；`exactOptionalPropertyTypes`/`noImplicitOverride` 未评估（P1）。
- [B2] ❌ P0 — 显式 any 共 **49 处**，全部未登记豁免。分布：LayoutSetting ×4（模板 `:type as any`）、MenuTree ×5、me/crud ×6、me/modal ×2、me-components ×6、naiveTools ×2、http/index ×6、http/interceptors ×3、common ×2、is ×2、app.ts persist ×1、SideMenu ×2、UserAvatar ×1、useForm 默认 ×1、resource/api ×1、ResAddOrEdit ×1、三页 queryItems `Record<string, any>` ×3、MenuTree/ResAddOrEdit emit `data?: any` ×2。
- [B3] ❌ P0 — `as unknown as` ×5：http/index.ts:55,59（axios→HttpClient 桥接）、naiveTools.ts:128（GlobalThemeOverrides 型变）、MenuTree.vue:66,74（TreeOption→PermissionItem）。
- [B4] ❌ P0 — 模板内 as any ×10：LayoutSetting ×4、SideMenu ×2（options/value）、UserAvatar ×1、MenuTree ×3。
- [B5] ⚠️ — 抽测记录见下节。链路 1 ✅；链路 2 编译器可拦但被页面 `as` 抹平（B12 连带）；链路 3 论证不适用。
- [B6] ⚠️ P1 — 跨页重复形状：`Partial<X> & { pageNo… }` ×4、`UserRow`（user/index.vue:118 与 role-user.vue:74）、`genders` 常量（user:130 与 role-user:84）、`$table` ref 手写形状 ×4。
- [B7] ⚠️ P1 — 已有：类型谓词✓ 泛型组件✓ 泛型+约束✓ 映射/typeof（部分）✓ satisfies（basic-routes）✓ 声明合并✓ 工具类型组合✓。缺失：函数重载（storage）、模板字面量类型、readonly 常量、穷举 never 检查（论证见抽测记录）、条件类型+infer（论证：无递归/解包推导场景）。settings 静态数据未 satisfies。
- [B8] ❌ P1 — 类型说谎：`Partial<UserInfo> & { enable?: number }` 交集使 enable 变 never（被 `Record<string, any>` 的 queryItems 掩盖，查询类型不连通）；login/api.ts `getUser` 声明返回 `UserInfo` 而端点实际返回 `RawUserInfo`（与 @/api 同端点类型互相矛盾）；permission.ts `layout as LayoutMode`。
- [B9] ❌ P0 — 疤痕 7 处未闭环：App.vue:47（TODO 兼容旧持久化值）、me/modal/index.vue:47（TODO 原实现 bug）、useAliveData.ts:2（"暂时没使用"）、auth.ts:56（naivue TODO）、models.ts:21（enable TODO）、tab.ts:93（"修复：原代码…"）、resource/user/role 页"运行时临时字段"措辞 ×3；`docs/ts-migration-progress.md` 遗留项（enable 契约、App.vue 兼容分支、naivue 键、toggleRole、noUncheckedIndexedAccess、严格候选评估）全部未闭环。
- [B10] ❌ P1 — 17 个仅定义无调用导出（mockRequest、sStorage、debounce、formatDate、useResize、isEmpty、ifNull、isUrl、isPromise、isElement、isWindow、isDate、isRegExp、isBoolean、isNumber、isClient、resource/api getComponents——后者还绕过项目 http 封装裸用 axios）+ useAliveData 整个 composable 无调用方 + login/api.ts toggleRole、login/api.ts getUser。grep 调用方计数全部为 0，留痕见整改清单。注意：auth persist key `'naivue'` 与 App.vue 旧值兼容分支属"影响既有用户数据"类，按 B10 规则**不删**，走 B9 论证保留。
- [B11] ❌ P1 — 后端契约未单一事实源化：enable 脏形状未在 api 边界归一；查询参数无 PageQuery 收口；layout 字符串未归一。
- [B12] ❌ P1 — useCrud `doUpdate` 声明 id 可选而各页 api 要求 id 必填，页面以 `as` 断言对齐 ×7（user:151-152、role:119-120、profile 等）；ContextMenu.vue / QuestionLabel.vue 仍为运行时式 `defineProps({...})`（其余组件均类型式，模式不统一）。
- [B13] ⚠️ P2 — README.md、docs/{architecture,module-architecture,ascii-architecture,arch-overview}.md 仍以 .js 文件名描述现状。
- [B14] ⚠️ P2 — 工具链 .js 并入 A1 整改；tsconfig 无分组注释。

### 支柱 C

- [C1] ❌ P1 — api 层 CRUD 样板 4 份未工厂化（user/role 的 create/read/update/delete + role.getAllUsers 复制 user read 契约）；jscpd TS 重复 5 处（最大 role-user.vue:92↔user:158 37 行，user/role/resource 三页之间）；`handleEnable` 状态开关处理 user/role 两页重复。
- [C2] ⚠️ P1 — 函数长度/文件长度全部达标；魔法数字少量内联（http SUCCESS_CODES、tab.ts 100ms、naiveTools 5000/200ms 默认值——有注释，整改中常量化）。
- [C3] ✅ — 单一职责走查达标；错误处理策略统一（http 层集中提示，业务层 console.error + loading 复位，无散落吞错）。
- [C4] ✅ — 新增资源页经 useCrud 配置 + api 工厂扩展；MeCrud 列配置可扩展（hideInExcel 交叉类型）。
- [C5] ❌ P0 — 测试设施缺失（与 T1 同源）；副作用已集中在边界（http/naiveTools/window.$xxx），可测试性设计基础尚可。
- [C6] ✅ — 无 view→view import；复用经 components/composables/api 通道。
- [C7] ❌ P0 — utils→store 向上依赖 3 处：naiveTools.ts:11（useAppStore）、http/helpers.ts:1、http/interceptors.ts:3（useAuthStore）。方向规则未机器化（eslint 无 no-restricted-imports）= P1。
- [C8] ⚠️ P1 — 矩阵核对：http 异常族代码侧有处理（resolveResError/needTip/401 确认锁）；路由守卫有 validateMenuPath 兜底；useCrud 空值删除守卫 ✓；storage 损坏/过期处理 ✓；MeCrud 空态 ✓。缺口：tab.removeTab 关到最后一个时 `this.tabs[length-1].path` 空数组崩溃（undefined.path TypeError）；MenuTree onSelect 第二参数签名与 naive-ui 实际回调形状不符（靠 as any 掩盖）；storage.getItem 的 `null as T` 默认值设计。八格均无单测佐证（T1 缺失连带）。
- [C9] ✅ — 引用 2026-10-03 全流程 GUI 实测记录（docs/ts-migration-progress.md 顶部，apifox 云端 mock，dev+preview 双模式，§E 11 组全过）；本轮整改后按 r2 报告复验。

## 类型连通抽测记录（B5）

- 链路 1（用户列表页）：`render: ({ avatar, nmae }: UserRow) => …` → `error TS2339: Property 'nmae' does not exist on type 'UserRow'` ✅ 拦截（临时改动已还原，git status 干净）。
- 链路 2（写路径）：移除 user 页 doUpdate 包装的 `as` 后 `api.update(data)` → `error TS2345: Argument of type 'UserForm' is not assignable to parameter of type 'Partial<UserInfo> & { id: number }'` — 编译器在 api 形状层可拦截 ✅；但现状页面以 `as` 断言抹平（7 处），类型连通被人为断开 → B12 整改项。
- 链路 3（分支穷举）：http 错误分支的 code 是开放集合（number | string，含 axios 字符串码如 'ERR_NETWORK'），ModalAction 设计为可扩展联合（`(string & {})`），均无闭合可辨识联合驱动分支 → never 穷举检查无适用位置，按 B7"确不适合需论证"处理，不硬塞。useCrud 的 add/edit 分支将以类型守卫（`isAddOrEdit`）收窄消除断言。

## 测试执行记录（支柱 D）

- pnpm test / test:type / test:cov：**不存在**（package.json 无脚本、无 vitest/happy-dom/@vitest/coverage-v8 依赖、无 tests/ 目录）→ T1/T5 P0。
- T8 冒烟：本轮未执行（整改后 r2 报告执行 dev + preview 双 200）。
- L4 功能测试：仓库无 Playwright 等 E2E 设施；将按 playbook §F4 方式 A（browser-use 驱动）在 r2 复验执行。

## 豁免登记（预登记，整改后复核）

| 位置                                       | 类型                        | 理由                                                                                                                                                  | 结论                                                       |
| ------------------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| utils/http/index.ts（request 桥接）        | as unknown as → 收敛为 1 处 | 拦截器把 AxiosResponse 重写为后端响应体，axios 方法级泛型（R 默认 AxiosResponse<T>）无法表达该运行时事实，HttpClient 自封装接口为最诚实描述           | 保留 + 行内注释（第三方类型局限）                          |
| utils/naiveTools.ts（configProviderProps） | as unknown as → 尽力收窄    | naive-ui GlobalThemeOverrides 与 ConfigProviderProps['themeOverrides'] 深层型变不兼容（官方已知缺陷，computed<ConfigProviderProps> 文档写法编译不过） | 优先尝试单点断言 themeOverrides 值，失败则保留双断言并登记 |

## 整改清单（按 P0→P1）

| #   | 级别 | 问题                                                       | 证据          | 方案                                                                                                  | 验证手测点（§E）        |
| --- | ---- | ---------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | P0   | 8 个 .js + 构建配置类型盲区                                | A1 find 输出  | 全部 TS 化 + tsconfig.node.json 纳入 typecheck                                                        | 2/3/4/6（构建产物不变） |
| 2   | P0   | 49 处 any / 5 处双重断言 / 10 处模板 as any                | B2/B3/B4 清单 | 逐处消灭（unknown 收窄、类型守卫、扩第三方类型、契约归一）                                            | 3/4/6/7                 |
| 3   | P0   | noUncheckedIndexedAccess 未开启                            | tsconfig.json | 开启并修复全部索引访问（守卫/at()/?? 兜底）                                                           | 8（tab 增删边界）       |
| 4   | P0   | 测试设施缺失                                               | package.json  | vitest + happy-dom + coverage + 三脚本 + F2 必测清单用例                                              | 1-11（回归）            |
| 5   | P0   | utils→store 依赖方向违规 ×3                                | C7 grep       | http 令牌/登出与 naive 主题改为入口注入（main.ts 装配）                                               | 1/9（登录、主题）       |
| 6   | P0   | 疤痕 7 处 + 遗留项未闭环                                   | B9 grep       | 修复（enable 契约、死代码）或论证改写措辞（naivue 键、App.vue 兼容）；progress 文档归档               | 3/8/9                   |
| 7   | P1   | api CRUD 样板未工厂化、页面断言 7 处、契约矛盾             | C1/B12        | createCrudApi<T,Q> 工厂 + useCrud doUpdate 收紧为必带 id + PageQuery 收口                             | 3/4/5                   |
| 8   | P1   | 17+3 个死代码                                              | B10 grep 计数 | 删除并留痕（useAliveData、toggleRole、login getUser、mockRequest、is/common 无用导出、getComponents） | —                       |
| 9   | P1   | jscpd 重复 5 处                                            | C1            | UserRow/genders/列渲染收口 useUserInfoColumns；handleEnable 收口                                      | 3/4/5                   |
| 10  | P1   | ContextMenu/QuestionLabel 运行时 props；$table 手写形状 ×4 | B12           | 类型式 props + InstanceType 统一                                                                      | 8                       |
| 11  | P1   | 方向规则未机器化                                           | eslint.config | no-restricted-imports 固化四层方向并验证拦截                                                          | —                       |
| 12  | P1   | B7 特性缺口（重载/模板字面量/readonly/satisfies）          | 逐模块核查    | storage get 重载、IconName 模板字面量、LAYOUT_MODES as const 派生、settings satisfies                 | —                       |
| 13  | P1   | C8 边界矩阵缺口                                            | 矩阵核对      | tab 空数组守卫（改前崩溃/改后 no-op，行为差异登记）、MenuTree 回调签名对齐、单测覆盖八格              | 8                       |
| 14  | P1   | T2-T7 测试标准缺失                                         | 无测试        | tests/ 镜像结构 + AAA + L2 类型测试 + T7 诚信扫描                                                     | —                       |
| 15  | P2   | docs .js 描述、tsconfig 无分组注释、A7 JSDoc 措辞          | B13/B14       | 文档现状化 + tsconfig 分组注释 + JSDoc 具名                                                           | —                       |

## 需人工复核项

- naive-ui configProviderProps 双重断言若收窄尝试失败，需人工复核豁免登记的"无替代方案"论证。
- auth persist key `'naivue'` 保留论证（改动会丢失既有用户会话，属用户数据迁移决策）。
- App.vue 旧持久化值兼容分支保留论证（同上，B10 规则二选一中选"论证保留"）。
