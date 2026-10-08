import type { UserInfo } from '@/types/models'
import { request } from '@/utils'

export default {
  // 修改当前登录用户密码：oldPassword 原密码，newPassword 新密码
  changePassword: (data: { oldPassword: string, newPassword: string }) => request.post('/auth/password', data),
  // 更新用户资料：data 必带用户 id，其余字段（昵称/性别/地址/邮箱/头像）按需传入
  updateProfile: (data: Partial<UserInfo> & { id: number }) => request.patch(`/user/profile/${data.id}`, data),
}
