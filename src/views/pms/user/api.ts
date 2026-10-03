import type { PageResult, Role, UserInfo } from '@/types/models'
import { request } from '@/utils' // ① 拿"加工过的 axios 实例"，不是裸 axios

// api.js 的本质就是：把"一次 HTTP 调用"包装成一个"有名字的 JS 函数"
export default { // 默认导出
  create: (data: Partial<UserInfo>) => request.post('/user', data),
  // 列表查询：后端分页返回 PageResult，非分页返回完整数组
  read: (params: Partial<UserInfo> & { pageNo?: number, pageSize?: number, enable?: number } = {}) =>
    request.get<PageResult<UserInfo> | UserInfo[]>('/user', { params }),
  update: (data: Partial<UserInfo> & { id: number }) => request.patch(`/user/${data.id}`, data),
  delete: (id: number) => request.delete(`/user/${id}`),
  resetPwd: (id: number, data: { password: string }) => request.patch(`/user/password/reset/${id}`, data),

  getAllRoles: () => request.get<Role[]>('/role?enable=1'),
}
