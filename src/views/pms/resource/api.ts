import type { PageParams, PermissionItem } from '@/types/models'
import { request } from '@/utils'

// 按钮列表查询参数：parentId 指定所属菜单；作为 MeCrud 数据源时会自动合入分页参数
export type ButtonQuery = { parentId?: number | string | null } & PageParams

export default {
  // 获取完整菜单树：返回目录/菜单级联结构，供左侧 MenuTree 渲染
  getMenuTree: () => request.get<PermissionItem[]>('/permission/menu/tree'),
  // 查询某菜单下的按钮权限点：parentId 为菜单 id
  getButtons: (params: ButtonQuery) => request.get<PermissionItem[]>(`/permission/button/${params.parentId}`),
  // 新增权限资源：data 可为目录/菜单/按钮，按 type 区分
  addPermission: (data: Partial<PermissionItem>) => request.post<PermissionItem>('/permission', data),
  // 更新权限资源：id 为资源 id，data 为要修改的字段
  savePermission: (id: number | string, data: Partial<PermissionItem>) => request.patch(`/permission/${id}`, data),
  // 删除权限资源：id 为资源 id
  deletePermission: (id: number | string) => request.delete(`/permission/${id}`),
}
