/**
 * 跨层共享的后端契约与前端实体模型（全项目实体唯一定义处）
 */
import type { VNode } from 'vue'

import type { RouteMeta } from 'vue-router'

/** 用户角色 */
export interface Role {
  id: number
  name: string
  /** 角色编码（如 SUPER_ADMIN，内置角色禁止编辑时依赖它判断） */
  code?: string
  enable?: boolean
}

/**
 * 前端实际使用的用户信息（由 store/helper.ts getUserInfo() 从后端原始数据重组而来）。
 * 注意 enable 在行数据上是 boolean，列表查询契约则是 0/1 数字，二者由 EnabledQuery 区分、不混用
 */
export interface UserInfo {
  id: number
  username: string
  avatar?: string
  nickName?: string
  /** 1 男 / 2 女 / 0 保密 */
  gender?: number
  address?: string
  email?: string
  /** 账号启用状态（用户页状态开关） */
  enable?: boolean
  /** 仅列表接口返回（详情接口不含），故可选 */
  createTime?: string
  roles: Role[]
  currentRole: Role
}

/** 权限树节点（后端权限/菜单数据，settings 静态数据与 permission store 共用） */
export interface PermissionItem {
  /** 后端节点可能携带任意扩展字段，索引签名如实声明；已知字段仍单独声明以保留精确类型 */
  [key: string]: unknown
  /** 后端主键（资源管理页行数据有，settings 静态数据无） */
  id?: number
  code: string
  name: string
  /** 节点类型：目录 / 菜单 / 按钮权限 */
  type: 'DIR' | 'MENU' | 'BUTTON'
  /** 父级节点 id（资源页新增下级菜单时使用） */
  parentId?: number | string | null
  icon?: string
  /** DIR/MENU 的路由路径；外链时为 http 开头 */
  path?: string
  order?: number
  enable?: boolean
  /** 是否在菜单中显示 */
  show?: boolean
  /** 页面是否启用 keep-alive 缓存 */
  keepAlive?: boolean
  layout?: string
  redirect?: string
  /** 后端返回的组件路径字符串（如 '/src/views/iframe/index.vue'），生成路由时才解析为组件 */
  component?: string
  children?: PermissionItem[]
}

/** 挂在 MENU 下的按钮权限节点（写入 RouteMeta.btns，供 v-permission 指令消费） */
export interface RouteBtn {
  code: string
  name: string
}

/** MeCrud 分页契约：后端分页返回 { pageData, total }，非分页接口直接返回数组 */
export interface PageResult<T = unknown> {
  pageData: T[]
  total: number
}

// 列表查询参数契约：查询侧类型与实体类型分离，二者不混用

/** 分页参数（pageNo/pageSize 由 MeCrud 组装进请求） */
export interface PageParams { pageNo?: number, pageSize?: number }

/** 状态字段的查询侧契约：列表过滤用 0/1 数字，与行数据的 boolean 开关区分 */
export interface EnabledQuery { enable?: 0 | 1 }

/**
 * 用户列表查询参数：实体过滤字段 + 分页组合；enable 从实体 Omit 后改用数字契约覆盖，
 * 索引签名声明查询参数本质是字符串键的宽松键袋（满足 MeCrud 泛型 Q 的约束）
 */
export type UserInfoQuery = Omit<Partial<UserInfo>, 'enable'> & EnabledQuery & PageParams & Record<string, unknown>

/** 角色列表查询参数（与用户查询同构） */
export type RoleQuery = Omit<Partial<Role>, 'enable'> & EnabledQuery & PageParams & Record<string, unknown>

/** 登录成功返回的 token 载荷（auth store 只消费 accessToken） */
export interface LoginToken {
  accessToken: string
}

/** 后端原始用户信息（个人资料嵌套在 profile 里），getUserInfo() 据此拍平重组为 UserInfo */
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
 * 侧边栏菜单树节点（permission store getMenuItem 产出，直接绑定 naive-ui 的 n-menu）。
 * key 用 string 是因为路由 name 均为权限 code 等字符串，结构上与 MenuOption 兼容，模板绑定无需断言
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
 * 权限 store 生成的动态路由记录：component 在 store 阶段仍是后端给的字符串路径，
 * 到路由守卫里才经 import.meta.glob 替换为真实懒加载组件。
 * 不从 RouteRecordRaw 派生，因为 Omit 作用在联合类型上会塌缩出错误的 redirect 类型
 */
export interface AccessRoute {
  /** 路由 name（权限 code，generateRoute 恒赋值） */
  name: string
  path?: string
  redirect?: string
  /** store 阶段为字符串路径，守卫阶段替换为懒加载组件 */
  component?: unknown
  meta: RouteMeta
}
