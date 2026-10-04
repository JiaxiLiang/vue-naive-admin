import type { Role, UserInfo, UserInfoQuery } from '@/types/models'
import { createCrudApi } from '@/api'
import { request } from '@/utils'

// api.ts 的本质就是：把"一次 HTTP 调用"包装成一个"有名字的 JS 函数"
// CRUD 四件套由工厂生成；查询参数契约 UserInfoQuery 经 MeCrud 的 :get-data 反向推断到页面
const crud = createCrudApi<UserInfo, UserInfoQuery>('/user')

export default {
  ...crud,
  resetPwd: (id: number, data: { password: string }) => request.patch(`/user/password/reset/${id}`, data),

  getAllRoles: () => request.get<Role[]>('/role?enable=1'),
}
