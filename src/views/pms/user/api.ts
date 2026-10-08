import type { Role, UserInfo, UserInfoQuery } from '@/types/models'
import { createCrudApi } from '@/api'
import { request } from '@/utils'

// 用户的增删改查/分页接口由工厂统一生成；查询参数契约 UserInfoQuery 经 MeCrud 的 :get-data 反向推断到页面
const crud = createCrudApi<UserInfo, UserInfoQuery>('/user')

export default {
  ...crud,
  // 管理员重置指定用户密码：id 用户 id，password 新密码
  resetPwd: (id: number, data: { password: string }) => request.patch(`/user/password/reset/${id}`, data),

  // 全量启用角色列表：供分配角色下拉；signal 供 useRequest 的 AbortController 透传，不传时行为不变
  getAllRoles: (signal?: AbortSignal) => request.get<Role[]>('/role?enable=1', { signal }),
}
