import type { PageParams, PermissionItem } from '@/types/models'
import { request } from '@/utils'

/** 按钮列表查询参数（resource 页 MeCrud 数据源，MeCrud 会把分页参数一并合入 params） */
export type ButtonQuery = { parentId?: number | string | null } & PageParams

export default {
  getMenuTree: () => request.get<PermissionItem[]>('/permission/menu/tree'),
  getButtons: (params: ButtonQuery) => request.get<PermissionItem[]>(`/permission/button/${params.parentId}`),
  addPermission: (data: Partial<PermissionItem>) => request.post<PermissionItem>('/permission', data),
  savePermission: (id: number | string, data: Partial<PermissionItem>) => request.patch(`/permission/${id}`, data),
  deletePermission: (id: number | string) => request.delete(`/permission/${id}`),
}
