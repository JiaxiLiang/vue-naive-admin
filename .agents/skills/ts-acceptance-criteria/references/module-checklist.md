# 支柱 B（从零构建标准）逐模块核查矩阵

用法：进入 SKILL.md §4（支柱 B）核查前必读。对每个模块：读"验收动作"指定的文件，逐条核对"必须体现"的特性；"典型违规快照"（2026-10-04）是整改前的已知状态，用于帮助定位——整改后失效，不代表最终判定。

## 特性落点总表（B7 的 12 项特性各自该出现在哪）

| 特性 | 本项目的合适落点 | 判定要点 |
|---|---|---|
| 泛型函数 + 约束 + 默认值 | `useCrud<T extends object>`、`useForm`、api CRUD 工厂 `createCrudApi<T>` | 约束真实生效（传不满足的实参会报错），默认值有业务意义 |
| 泛型组件 | MeCrud `generic="T extends Record<string, any>"` | 使用方 `DataTableColumns<T>` 的 render(row) 参数自动收窄到 T |
| 类型谓词（`val is T`） | `src/utils/is.ts` 全部函数、permission store 的 filter、MenuTree 的 option 收窄 | 入参 unknown、谓词签名正确，不用 `!!` 硬凑返回值 |
| 可辨识联合 + 穷举（never 检查） | http 错误分支、ModalAction 处理、导出格式分支 | 至少一处 `default` 分支有 never 穷举检查 |
| 映射类型 / `keyof typeof` | settings 常量 → LayoutMode、ACTIONS 表、权限码/事件名常量 → 联合类型 | 类型从常量派生（typeof/keyof），不是手写重复一份 |
| 条件类型 + infer | useForm 的表单类型推导、Awaited 响应解包、主题覆盖 DeepPartial | 至少一处真实使用，用在能消除断言的位置 |
| 模板字面量类型 | storage key 前缀（`naive-admin:${string}`）、icon 名（`i-${string}`）、路由 path 模式 | 至少一处 |
| satisfies | `basic-routes`、settings 静态数据、ACTIONS/错误码映射表 | 保留字面量最窄推断，且字段拼错能报错 |
| 声明合并 | `RouteMeta`（router.d.ts）、`Window`（global.d.ts） | 字段齐全、被实际读写，不是摆设 |
| 函数重载 | storage `get`（有无默认值两种返回类型）、is.ts | 至少一处自然使用 |
| 工具类型组合 | `ReturnType<NonNullable<...>>`、`PageQuery<T> = Partial<T> & Paging`、`Awaited` | 类型从别的类型推导出来，不重新手写形状 |
| readonly / unknown 优先 | 实体只读视图、常量数组 `as const`；拦截器错误链路用 unknown | 生产代码不再出现可避免的 any |

## 逐模块矩阵

### 1. 类型地基 `src/types/`
- **必须体现**：`declare global` + Window 扩充；vue-router `RouteMeta` 声明合并；`ImportMetaEnv`；虚拟模块声明与 build 实现同源；实体模型集中且形状与后端一一对应。
- **典型违规快照**：`enable: boolean | 0 | 1` 契约妥协未归一；RawUserInfo/UserInfo 双形状缺转换层的显式边界函数。
- **验收动作**：通读 models.ts、router.d.ts、global.d.ts、env.d.ts、me-components.ts、virtual-modules.d.ts。

### 2. `src/settings.ts`
- **必须体现**：`as const` + `typeof`/`keyof typeof` 派生 LayoutMode 等联合；静态数据 `satisfies PermissionItem[]`。
- **典型违规快照**：LayoutMode 已导出（好）；静态数据未用 satisfies 校验。
- **验收动作**：通读 settings.ts。

### 3. `src/utils/is.ts`
- **必须体现**：每个函数类型谓词、入参 unknown、零 any（含泛型约束里的 any）。
- **典型违规快照**：`isFunction<T extends (...args: any[]) => any>` 泛型约束含 any，应为 `unknown[]`。
- **验收动作**：通读 is.ts；确认每个导出有单测（C5，必测清单见 playbook §F）。

### 4. `src/utils/common.ts`
- **必须体现**：throttle/debounce 泛型 + `Parameters<T>`/`ReturnType<T>`；formatDateTime 用 dayjs `ConfigType`；无 `this: any`。
- **典型违规快照**：`<T extends (...args: any[]) => any>` ×2。
- **验收动作**：通读 common.ts。

### 5. `src/utils/storage/`
- **必须体现**：泛型类/工厂、`StorageLike` 别名、key 模板字面量类型、JSON 解析损坏的边界处理、函数重载（get 有无默认值）。
- **典型违规快照**：`null as T`、解构处断言——从零标准应重设计为类型安全的序列化边界。
- **验收动作**：通读 storage.ts、index.ts；核对损坏 JSON/过期键单测。

### 6. `src/utils/http/`
- **必须体现**：`ApiResult<T>`/`RequestError`/`HttpClient` 自封装接口覆盖 axios 返回形状；拦截器全链路 unknown + 收窄；错误码映射表 satisfies/字面量联合；`createAxios` 直接返回 HttpClient（无双重断言）。
- **典型违规快照**：`request = createAxios() as unknown as HttpClient`（http/index.ts:55,59）、`AxiosError<any>`（interceptors.ts:51,55）。
- **验收动作**：通读 index.ts、interceptors.ts、helpers.ts；做 B5 抽测链路 1。

### 7. `src/utils/naiveTools.ts` + `src/types/global.d.ts`
- **必须体现**：Message/Dialog/Notification/LoadingBar 契约集中声明；`WrappedMessage` 方法签名完整；离散 API 配置用正确类型（无双重断言）。
- **典型违规快照**：`(NDialog as any)[option.type]`（:107,115）、`as unknown as ComputedRef<ConfigProviderProps>`（:128）——官方 GlobalThemeOverrides 型变缺陷，属可豁免项但必须登记并论证无替代方案。
- **验收动作**：通读 naiveTools.ts + global.d.ts；核对豁免登记。

### 8. api 层 `src/api/index.ts` + `src/views/*/api.ts`
- **必须体现**：CRUD 工厂 `createCrudApi<T>(resource)` 消灭 4 份样板；`PageQuery<T>` 共享类型收口 `Partial<X> & { pageNo, pageSize, enable }`；每个端点请求/响应类型显式；无低效重复/低质量导出（高质量暂无调用的"预留能力"保留并登记，见 B10 修订标准）。
- **典型违规快照**：user/role/resource 三份 create/read/update/delete 仅资源名不同（C1）；`Partial<...> & { pageNo?: number... }` 重复 4 处；`toggleRole` 死代码（login/api.ts）。
- **验收动作**：通读 5 份 api.ts 对比重复度；核对工厂化后的类型推导链。

### 9. `src/composables/`
- **必须体现**：泛型约束贯穿；`ModalAction` 收窄无断言（用类型守卫或 `Partial<Record<ModalAction, string>>`）；`UseCrudOptions<T>` 约束完整；返回类型显式；`handleSave` 返回值统一（boolean | undefined 的 undefined 分支语义化）。
- **典型违规快照**：`ModalAction = ... | (string & {})` 模糊联合；`actions[modalAction.value as 'add' | 'edit']`（useCrud.ts:96）。
- **验收动作**：通读 useCrud.ts、useForm.ts、useModal.ts、useAliveData.ts；核对并发保存/未挂载边界单测。

### 10. `src/store/`
- **必须体现**：options store getter 用 state 参数式；persist 配置类型完整（无 as any）；类型谓词；persist key 无拼写错误；无低效重复/低质量代码（高质量暂无调用的"预留能力"保留并登记，见 B10 修订标准）。
- **典型违规快照**：app.ts:80 persist 整体 `as any`（TS2589）；auth.ts persist key `'naivue'` 拼写（TODO 保留）；permission.ts `layout as LayoutMode` 契约妥协。
- **验收动作**：通读 6 个 store + helper.ts；TS2589 须论证重构（如收窄 persist pick 类型）而非豁免。

### 11. `src/components/me/`（MeCrud/MeModal/QueryItem）
- **必须体现**：MeCrud 泛型组件；`defineEmits<{...}>()` 类型签名式；`ModalOptions` 契约无 any 回调参数；naive-ui 列类型扩展（自定义字段用接口扩展/交叉而非 as any）。
- **典型违规快照**：`handleOk(data?: any)`（modal/index.vue:97、me-components.ts:18-29）、`(item as any).type === 'selection'`（crud/index.vue:185）、`(style as any)[key]`（modal/utils.ts:10）。
- **验收动作**：通读 3 个组件 + me-components.ts；做 B5 抽测链路 1 的 render 收窄验证。

### 12. `src/components/common/`
- **必须体现**：props/emits 全类型化；naive-ui ButtonType 等枚举正确使用（不用 '' 糊弄联合类型）。
- **典型违规快照**：LayoutSetting 四处 `:type="(cond ? 'primary' : '') as any"`；TheFooter/TheLogo 无 script 块（合规，A2 扫描须能识别）。
- **验收动作**：通读 9 个组件。

### 13. `src/router/` + `src/router/guards/`
- **必须体现**：`satisfies RouteRecordRaw[]`；RouteMeta 合并被实际消费；守卫返回 `RouteLocationRaw` 无多余断言；`AccessRoute.component` 收窄链路清晰；后端接口挂掉时守卫有兜底。
- **典型违规快照**：permission-guard `as string`/`as RouteRecordRaw` 断言 3 处（从零标准应通过更好的类型设计消除或收窄）。
- **验收动作**：通读 basic-routes.ts、index.ts、4 个 guard。

### 14. `src/directives/`
- **必须体现**：`Directive<HTMLElement, string>` 泛型；`withPermission` 显式签名。
- **典型违规快照**：已达标（快照无违规）。
- **验收动作**：通读 index.ts。

### 15. `src/layouts/`
- **必须体现**：全部 `lang="ts"`；props/emits 类型化；菜单/下拉数据用扩展类型对齐 naive-ui（扩展 `DropdownOption` 等），模板零 as any。
- **典型违规快照**：SideMenu.vue:10-11、UserAvatar.vue:2 模板 as any（根因：自定义 `show: ComputedRef` 扩展字段——正规解法是模块扩充 naive-ui 类型或映射成标准类型）；layouts/empty/index.vue 无 lang="ts"（快照）。
- **验收动作**：通读 SideMenu.vue、tab/index.vue、UserAvatar.vue + 抽查 3 个布局壳。

### 16. `src/views/`
- **必须体现**：页面级 Row/Form 模型模式统一（XxxRow/XxxForm）；`DataTableColumns<T>` render 参数显式标注；表单值传 api 零 `as Partial<X> & { id: number }` 式断言（用类型守卫/必填校验后的收窄）；CRUD 装配零复制。
- **典型违规快照**：ResAddOrEdit.vue:169,174 断言 ×2；MenuTree.vue:16-17 模板 as any ×2；各页 `modalForm.value as Partial<UserInfo> & { id: number }` 式断言若干。
- **验收动作**：通读 pms/user/index.vue、pms/resource/index.vue、role/index.vue；做 B5 抽测链路 2。

### 17. 构建与工具链（根目录 + `build/` + `src/assets/icons/`）
- **必须体现**：vite.config.ts（defineConfig + 插件类型）、uno.config.ts、eslint.config.ts、build/*.ts（esno 已在 devDeps，可直接跑 TS）、dynamic-icons.ts（`i-${string}` 模板字面量类型）；虚拟模块声明与 TS 实现返回值同源核对；tsconfig 将构建配置纳入检查。
- **典型违规快照**：8 个 .js 全在此模块（vite.config.js、uno.config.js、eslint.config.js、build/index.js、build/plugin-isme/{index,icons,page-pathes}.js、dynamic-icons.js）。
- **验收动作**：通读迁移后的全部构建配置；核对 `pnpm dev`/`build`/`lint` 正常。
