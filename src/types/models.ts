/**
 * 跨层共享的实体模型与后端契约（全项目唯一实体定义处）
 * 形状依据：store/helper.ts getUserInfo 重组字段、views/pms 各页列渲染字段、
 * store/modules/permission.ts generateRoute/getMenuItem、settings.ts basePermissions
 */
import type { VNode } from 'vue'

import type { RouteMeta } from 'vue-router'

/** 用户角色 */
export interface Role {
  id: number
  name: string
  /** 角色编码（如 SUPER_ADMIN，role 页禁用编辑用） */
  code?: string
  enable?: boolean
}

/**
 * 用户信息（store/helper.ts getUserInfo() 重组后的形状，即前端实际使用的形状）
 * 关于 enable：行数据开关用 boolean，列表过滤时后端契约是 0/1 数字——
 * 查询侧契约由 EnabledQuery 表达，两侧类型不混用（见各 api 的 Query 类型）
 */
export interface UserInfo {
  id: number
  username: string
  avatar?: string
  nickName?: string
  /** 1 男 / 2 女 / 0 保密（profile 页 genders 常量） */
  gender?: number
  address?: string
  email?: string
  /** 账号启用状态（user 页状态开关） */
  enable?: boolean
  /** 列表接口返回的创建时间（详情接口不含该字段，故可选） */
  createTime?: string
  roles: Role[]
  currentRole: Role
}

/** 权限/菜单项（后端权限树节点，settings 静态数据与 permission store 共用） */
export interface PermissionItem {
  /** 后端节点可能携带任意扩展字段（如时间戳），索引签名声明这一事实；已知字段单独声明保留字段级类型 */
  [key: string]: unknown
  /** 后端主键（资源页行数据有 id；settings 静态数据无 id） */
  id?: number
  code: string
  name: string
  type: 'DIR' | 'MENU' | 'BUTTON'
  /** 父级菜单 id（资源页新增下级菜单用） */
  parentId?: number | string | null
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

/** MeCrud 分页契约：后端分页返回 { pageData, total }，非分页返回数组本身 */
export interface PageResult<T = unknown> {
  pageData: T[]
  total: number
}

// ── 列表查询参数契约（api 边界归一，B11）──────────────────────────────

/** 分页参数（MeCrud 分页契约的查询侧：pageNo/pageSize 由 MeCrud 组装进请求） */
export interface PageParams { pageNo?: number, pageSize?: number }

/** 状态字段的查询侧契约：列表过滤用 0/1 数字，与行数据开关的 boolean 区分 */
export interface EnabledQuery { enable?: 0 | 1 }

/**
 * 用户列表查询参数：实体过滤字段 + 分页（enable 走数字契约，故从实体形状中排除后覆盖）；
 * 索引签名显式声明查询参数是字符串键的宽松键袋（MeCrud 泛型 Q 约束所需）
 */
export type UserInfoQuery = Omit<Partial<UserInfo>, 'enable'> & EnabledQuery & PageParams & Record<string, unknown>

/** 角色列表查询参数（role 页 /role/page 使用；与用户查询同构） */
export type RoleQuery = Omit<Partial<Role>, 'enable'> & EnabledQuery & PageParams & Record<string, unknown>

/** 登录成功后的 token 载荷（auth store setToken 只取 accessToken） */
export interface LoginToken {
  accessToken: string
}

/** 后端返回的原始用户信息（含嵌套 profile），store/helper.ts getUserInfo() 据此重组出前端的 UserInfo */
export interface RawUserInfo extends UserInfo {
  profile?: {
    avatar?: string
    nickName?: string
    gender?: number
    address?: string
    email?: string
  }
}

/**
 * 侧边菜单项（permission store getMenuItem 产出，Naive UI n-menu 的树节点）。
 * key 用 string：本应用路由 name 均为权限 code 等字符串（见 generateRoute 与 basic-routes），
 * 因此 MenuItem 结构上与 naive-ui 的 MenuOption 兼容，模板可直接绑定无需断言
 */
export interface MenuItem {
  label?: string
  key: string
  path?: string
  originPath?: string
  icon?: () => VNode
  order: number
  children?: MenuItem[]
}

/**
 * 权限 store 生成的动态路由：component 在 store 阶段仍是后端给的字符串路径，
 * 到 permission-guard 里才会被 import.meta.glob 替换为真实的懒加载组件。
 * 不从 RouteRecordRaw 派生（Omit 作用在联合类型上会塌缩出错误的 redirect 类型）；
 * name 为权限 code（string），generateRoute 恒赋值，故必填
 */
export interface AccessRoute {
  /** 路由名称（权限 code） */
  name: string
  path?: string
  redirect?: string
  /** store 阶段为字符串路径，permission-guard 替换为懒加载组件 */
  component?: unknown
  meta: RouteMeta
}
