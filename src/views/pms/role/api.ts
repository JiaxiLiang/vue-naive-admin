import type { PageResult, PermissionItem, Role, UserInfo } from '@/types/models'
import { request } from '@/utils'

export default {
  create: (data: Partial<Role>) => request.post('/role', data),
  // /role/page 是分页接口，非分页时返回数组本身
  read: (params: Partial<Role> & { pageNo?: number, pageSize?: number, enable?: number } = {}) =>
    request.get<PageResult<Role> | Role[]>('/role/page', { params }),
  update: (data: Partial<Role> & { id: number }) => request.patch(`/role/${data.id}`, data),
  delete: (id: number) => request.delete(`/role/${id}`),

  getAllPermissionTree: () => request.get<PermissionItem[]>('/permission/tree'),
  // 复用 /user 列表接口（role-user 页的 MeCrud 数据源）
  getAllUsers: (params: Partial<UserInfo> & { pageNo?: number, pageSize?: number, enable?: number } = {}) =>
    request.get<PageResult<UserInfo> | UserInfo[]>('/user', { params }),
  addRoleUsers: (roleId: number | string, data: { userIds: number[] }) => request.patch(`/role/users/add/${roleId}`, data),
  removeRoleUsers: (roleId: number | string, data: { userIds: number[] }) => request.patch(`/role/users/remove/${roleId}`, data),
}
