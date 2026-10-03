import type { PermissionItem } from '@/types/models'
import axios from 'axios'
import { request } from '@/utils'

export default {
  getMenuTree: () => request.get<PermissionItem[]>('/permission/menu/tree'),
  // 按钮权限列表（resource 页 MeCrud 数据源，query-items 传 { parentId }）
  getButtons: ({ parentId }: { parentId: number | string }) => request.get<PermissionItem[]>(`/permission/button/${parentId}`),
  // 原生 axios（非项目封装），返回的是 AxiosResponse，注意没有经过拦截器加工
  getComponents: () => axios.get(`${import.meta.env.VITE_PUBLIC_PATH}components.json`),
  addPermission: (data: Partial<PermissionItem>) => request.post('/permission', data),
  savePermission: (id: number | string, data: Partial<PermissionItem>) => request.patch(`/permission/${id}`, data),
  deletePermission: (id: number | string) => request.delete(`permission/${id}`),
}
