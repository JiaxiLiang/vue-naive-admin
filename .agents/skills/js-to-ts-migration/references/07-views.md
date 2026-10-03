# 阶段 8：views 逐页迁移（24 个页面）

顺序原则：先迁 pms 三页（共享层类型链路的主要消费者，问题会第一时间暴露），再迁其余。

## 8.0 每个页面的标准操作（10 步 checklist）

1. `<script setup>` → `<script setup lang="ts">`
2. 若该页有 `api.js` → 已在阶段 3 迁移；本页用到但未迁移的（如 demo/base 页），按阶段 3 模式现迁
3. 表格列声明 `const columns: DataTableColumns<User> = [...]`——泛型实参让每个 `render(row)` 的 row 自动收窄
4. `render: ({ avatar }) => h(NAvatar, ...)` 解构自动推导；显式 import 过的 naive-ui 组件（NAvatar/NButton/NTag/NSwitch）保持
5. `queryItems` → `ref<Record<string, any>>({})`（或页面级查询接口，若字段固定推荐定义 `interface UserQuery { username?: string, gender?: number, enable?: number }`）
6. `useCrud` 调用：泛型实参 `useCrud<UserInfo>({ ... })`，`initForm`/`doCreate` 等自动校验
7. `handleSave` 的自定义 `SaveAction` 分支（reset/setRole）已被类型约束，核对 api 函数签名
8. 补 `defineOptions({ name: 'XxxYyy' })` 的 keepAlive 名称（原本就有则不动）
9. 删除迁移过程中留下的显式类型冗余（让推导工作），但**不删注释**
10. 手测本页全部交互

## 8.1 页面清单与特殊注意点

### pms 组（先迁，5 个文件）

| 文件 | 注意点 |
|---|---|
| `pms/user/index.vue` | 参考实现，第一个迁。`columns: DataTableColumns<UserInfo>`；`render(row)` 里 `row.enableLoading` 是运行时临时字段不在 UserInfo 上 → 列类型用 `DataTableColumns<UserInfo & { enableLoading?: boolean }>` 或行内断言；`withPermission(h(...), 'SuperAdmin')` 已有类型 |
| `pms/role/index.vue` | 同上模式，实体 `Role`；权限树弹窗（getAllPermissionTree）数据是 `PermissionItem[]` |
| `pms/role/role-user.vue` | `addRoleUsers/removeRoleUsers` 的 data 参数形状以本页实际传参为准（userIds 数组），回填 role/api.ts |
| `pms/resource/index.vue` | 实体 `PermissionItem`；树形表格/级联选择处留意 children 递归类型 |
| `pms/resource/components/ResAddOrEdit.vue`、`MenuTree.vue` | 表单 model 用 `Partial<PermissionItem>`；MenuTree 的树控件 options 类型按 naive-ui TreeOption 适配 |

### 基础/演示组（机械迁移）

| 文件 | 注意点 |
|---|---|
| `home/index.vue` | vue-echarts：option 用 `EChartsOption`（`import type { EChartsOption } from 'echarts'`） |
| `base/index.vue`、`base/unocss.vue`、`base/unocss-icon.vue`、`base/test-modal.vue` | unocss-icon 页 `import icons from 'isme:icons'` 用阶段 0 的虚拟模块声明 |
| `base/changelog.vue` 等其余 base 页 | 常规 10 步 |
| `demo/upload/index.vue` | 上传 FormData/文件对象类型 `File` |
| `error-page/404.vue`、`403.vue` | 最简单，先迁可当热身 |
| `iframe/index.vue` | 关注 `route.meta.originPath`（RouteMeta 合并后可推导） |
| `login/index.vue` | storage 写 token 的调用（lStorage）泛型核对；登录表单 rules 用 naive-ui `FormRules` |
| `profile/index.vue` | 常规 |

### 视图迁移中最常见的三类类型问题（遇到时照此处理）

1. **render 函数里的运行时临时字段**（enableLoading 之类）：扩展实体 `& { enableLoading?: boolean }`，不污染 models.ts 的核心接口
2. **h() 的 props/插槽**：naive-ui 组件自带类型；`h('span', ...)` 原生标签无类型问题
3. **$.message/$dialog 裸调用**：阶段 0 的全局声明已覆盖，直接用

## 8.2 迁移完成的标志

全部 24 个页面迁移完后：

```bash
pnpm typecheck   # 应零错误
pnpm build       # 通过
grep -rL 'lang="ts"' src/views --include='*.vue'   # 应无输出（全部页面都是 ts）
```

## 验收

- 每迁完一组页面跑一次完整手测：pms 三页 CRUD + 导出 → 首页图表渲染 → 登录/登出 → 404/403 → demo 上传
- 全部完成后进入阶段 9（见 SKILL.md 主文件）
