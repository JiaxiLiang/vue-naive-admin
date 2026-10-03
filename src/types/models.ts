import type { VNode } from 'vue'
/**
 * 跨层共享的实体模型（全项目唯一实体定义处）
 * 依据来源：store/helper.js（getUserInfo 重组字段）、views/pms/user/index.vue（列渲染字段）、
 * store/modules/permission.js（generateRoute/getMenuItem 用到的字段）、settings.js（basePermissions 样例数据）
 */
import type { RouteMeta, RouteRecordName } from 'vue-router'

/** 用户角色 */
export interface Role {
  id: number
  name: string
  /** 角色编码（如 SUPER_ADMIN，role 页禁用编辑用） */
  code?: string
  enable?: boolean
}

/**
 * 用户信息（store/helper.js getUserInfo() 重组后的形状，即前端实际使用的形状）
 * 注意：enable 在查询条件里用 1/0 数字、在行数据开关里用 boolean，与后端契约保持宽松，
 * 重构统一为 boolean 属于改接口行为，超出本次范围 → TODO
 */
export interface UserInfo {
  id: number
  username: string
  avatar?: string
  nickName?: string
  gender?: number // 1 男 / 2 女（user 页 genders 常量，0 保密）
  address?: string
  email?: string
  /** 账号启用状态（user 页状态开关；查询条件里用 1/0 数字，契约宽松） */
  enable?: boolean
  roles: Role[]
  currentRole: Role
}

/** 权限/菜单项（后端权限树节点，settings.js basePermissions 与 permission store 共用） */
export interface PermissionItem {
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

/** MeCrud 分页契约（其 props 注释中的约定）：后端分页返回 { pageData, total }，非分页返回数组本身 */
export interface PageResult<T = unknown> {
  pageData: T[]
  total: number
}

/** 登录成功后的 token 载荷（auth store setToken 只取 accessToken） */
export interface LoginToken {
  accessToken: string
}

/** 后端返回的原始用户信息（含嵌套 profile），store/helper.js getUserInfo() 据此重组出前端的 UserInfo */
export interface RawUserInfo extends UserInfo {
  profile?: {
    avatar?: string
    nickName?: string
    gender?: number
    address?: string
    email?: string
  }
}

/** 侧边菜单项（permission store getMenuItem 产出，Naive UI n-menu 的树节点） */
export interface MenuItem {
  label?: string
  key: RouteRecordName
  path?: string
  originPath?: string
  icon?: () => VNode
  order: number
  children?: MenuItem[]
}

/**
 * 权限 store 生成的动态路由：component 在 store 阶段仍是后端给的字符串路径，
 * 到 permission-guard 里才会被 import.meta.glob 替换为真实的懒加载组件。
 * 不从 RouteRecordRaw 派生（Omit 作用在联合类型上会塌缩出错误的 redirect 类型）
 */
export interface AccessRoute {
  /** 路由名称（权限 code） */
  name?: RouteRecordName
  path?: string
  redirect?: string
  /** store 阶段为字符串路径，permission-guard 替换为懒加载组件 */
  component?: unknown
  meta: RouteMeta
}
