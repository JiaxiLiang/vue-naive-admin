import type { PermissionItem, Role, RoleQuery, UserInfo, UserInfoQuery } from '@/types/models'
import { createCrudApi } from '@/api'
import { request } from '@/utils'

// CRUD 四件套由工厂生成；/role/page 是分页接口，非分页时返回数组本身
const crud = createCrudApi<Role, RoleQuery>('/role', '/role/page')

export default {
  ...crud,

  getAllPermissionTree: () => request.get<PermissionItem[]>('/permission/tree'),
  // 复用 /user 列表端点（role-user 页的 MeCrud 数据源），查询契约与用户列表一致，实现经工厂共享
  getAllUsers: createCrudApi<UserInfo, UserInfoQuery>('/user').read,
  addRoleUsers: (roleId: number | string, data: { userIds: number[] }) => request.patch(`/role/users/add/${roleId}`, data),
  removeRoleUsers: (roleId: number | string, data: { userIds: number[] }) => request.patch(`/role/users/remove/${roleId}`, data),
}
