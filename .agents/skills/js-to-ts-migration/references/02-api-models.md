# 阶段 3：实体模型 + api 层

目标：把"后端返回的纯数据"建模成 TS 接口。这一层做完，阶段 8 迁移业务页面时 api 调用会自动获得完整类型推导。

## 3.1 新建 src/types/models.ts —— 实体模型（全项目唯一实体定义处）

依据来源：`store/helper.js`（getUserInfo 的重组字段）、`views/pms/user/index.vue`（列渲染用到的字段）、`store/modules/permission.js`（generateRoute/getMenuItem 用到的字段）、`settings.js`（basePermissions 样例数据）。

```ts
import type { ApiResult, PageResult } from '@/utils/http'   // PageResult 见 3.2，或放本文件

/** 用户角色 */
export interface Role {
  id: number
  name: string
  enable?: boolean
}

/**
 * 用户信息（store/helper.js getUserInfo() 重组后的形状，即前端实际使用的形状）
 * 注意：enable 在查询条件里用 1/0 数字、在行数据开关里用 boolean，与后端契约保持宽松，
 * 重构统一为 boolean 属于改接口行为，超出本次范围 → 只记 TODO
 */
export interface UserInfo {
  id: number
  username: string
  avatar?: string
  nickName?: string
  gender?: number            // 1 男 / 2 女（user 页 genders 常量）
  address?: string
  email?: string
  roles: Role[]
  currentRole: Role
}

/** 权限/菜单项（后端权限树节点，settings.js basePermissions 与 permission store 共用） */
export interface PermissionItem {
  code: string
  name: string
  type: 'DIR' | 'MENU' | 'BUTTON'
  icon?: string
  /** DIR/MENU 为路由路径；外链时为 http 开头 */
  path?: string
  order?: number
  enable?: boolean
  show?: boolean
  keepAlive?: boolean
  layout?: string
  redirect?: string
  /** 后端返回的组件路径字符串，如 '/src/views/iframe/index.vue' */
  component?: string
  children?: PermissionItem[]
}

/** 权限树里挂在 MENU 下的按钮权限（RouteMeta.btns） */
export interface RouteBtn {
  code: string
  name: string
}

/** MeCrud 分页契约（其 props 注释中的约定） */
export interface PageResult<T = unknown> {
  pageData: T[]
  total: number
}
```

## 3.2 src/api/index.js → api/index.ts

全局 api 聚合对象，逐个方法补泛型实参：

```ts
import type { UserInfo } from '@/types/models'
import { request } from '@/utils'

export default {
  /** 获取用户信息 */
  getUser: (): Promise<ApiResult<UserInfo>> => request.get<UserInfo>('/user/detail'),
  refreshToken: () => request.get('/auth/refresh/token'),
  logout: () => request.post('/auth/logout', {}, { needTip: false }),
  switchCurrentRole: (role: number | string) => request.post(`/auth/current-role/switch/${role}`),
  /** 当前角色权限树 */
  getRolePermissions: (): Promise<ApiResult<PermissionItem[]>> => request.get<PermissionItem[]>('/role/permissions/tree'),
  /** 校验菜单路径权限，data 为布尔 */
  validateMenuPath: (path: string) => request.get<boolean>(`/permission/menu/validate?path=${path}`),
}
```

返回类型注解可省略（泛型实参已推导），保留一种写法即可，不要既写泛型又写返回注解。

## 3.3 页面级 api：views/*/api.js → api.ts（本阶段一并迁移 3 个 pms 页）

实体泛型绑定示例（`src/views/pms/user/api.ts`）：

```ts
import type { PageResult, Role, UserInfo } from '@/types/models'
import { request } from '@/utils'

export default {
  create: (data: Partial<UserInfo>) => request.post('/user', data),
  /** 列表查询：后端分页返回 PageResult，前端需要完整数组时直接返回 User[] */
  read: (params: Partial<UserInfo> & { pageNo?: number, pageSize?: number, enable?: number } = {}) =>
    request.get<PageResult<UserInfo> | UserInfo[]>('/user', { params }),
  update: (data: Partial<UserInfo> & { id: number }) => request.patch(`/user/${data.id}`, data),
  delete: (id: number) => request.delete(`/user/${id}`),
  resetPwd: (id: number, data: { password: string }) => request.patch(`/user/password/reset/${id}`, data),
  getAllRoles: () => request.get<Role[]>('/role?enable=1'),
}
```

同样方式迁移：
- `views/pms/role/api.js` → `Role` 实体（`/role/page` 是分页接口，read 返回 `PageResult<Role> | Role[]`；`addRoleUsers`/`removeRoleUsers` 的 data 是 `{ userIds: number[] }` 形状，以页面实际传参为准）
- `views/pms/resource/api.js` → `PermissionItem` 实体

## 3.4 store/helper.js（仅接口层面核对，文件本体阶段 5 迁移）

`getUserInfo()` 的返回值必须严格等于 `UserInfo`；`getPermissions()` 返回 `Promise<PermissionItem[]>`。若发现实际字段与 models.ts 不符，**以实际数据为准修 models.ts**（models.ts 是描述现实，不是规定现实）。

## 验收

- `pnpm typecheck` 通过
- 手测：登录（getUser 有类型参与）、用户页列表/CRUD 正常（api.ts 变更直接生效）
- 自检：在 user/index.vue（仍是 .js）里临时写 `api.read().then(res => res.data?.pageData)`，IDE 应能推导出类型——验证通过后删除该临时代码
