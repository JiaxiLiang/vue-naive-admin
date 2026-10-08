import type { PermissionItem, Role, RoleQuery, UserInfo, UserInfoQuery } from '@/types/models'
import { createCrudApi } from '@/api'
import { request } from '@/utils'

// 角色的增删改查/分页接口由工厂统一生成
const crud = createCrudApi<Role, RoleQuery>('/role', '/role/page')

export default {
  ...crud,

  // 全量权限树：供角色弹窗勾选权限；signal 供 useRequest 的 AbortController 透传，不传时行为不变
  getAllPermissionTree: (signal?: AbortSignal) => request.get<PermissionItem[]>('/permission/tree', { signal }),
  // 全量用户列表：复用 /user 端点，供角色-用户分配页作为 MeCrud 数据源
  getAllUsers: createCrudApi<UserInfo, UserInfoQuery>('/user').read,
  // 给角色批量添加用户：roleId 角色 id，userIds 用户 id 数组
  addRoleUsers: (roleId: number | string, data: { userIds: number[] }) => request.patch(`/role/users/add/${roleId}`, data),
  // 给角色批量移除用户：roleId 角色 id，userIds 用户 id 数组
  removeRoleUsers: (roleId: number | string, data: { userIds: number[] }) => request.patch(`/role/users/remove/${roleId}`, data),
}
