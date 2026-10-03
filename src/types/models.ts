/**
 * 跨层共享的实体模型（全项目唯一实体定义处）
 * 依据来源：store/helper.js（getUserInfo 重组字段）、views/pms/user/index.vue（列渲染字段）、
 * store/modules/permission.js（generateRoute/getMenuItem 用到的字段）、settings.js（basePermissions 样例数据）
 */

/** 用户角色 */
export interface Role {
  id: number
  name: string
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

/** MeCrud 分页契约（其 props 注释中的约定）：后端分页返回 { pageData, total }，非分页返回数组本身 */
export interface PageResult<T = unknown> {
  pageData: T[]
  total: number
}

/** 登录成功后的 token 载荷（auth store setToken 只取 accessToken） */
export interface LoginToken {
  accessToken: string
}
