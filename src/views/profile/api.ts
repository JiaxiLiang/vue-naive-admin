import type { UserInfo } from '@/types/models'
import { request } from '@/utils'

export default {
  changePassword: (data: { oldPassword: string, newPassword: string }) => request.post('/auth/password', data),
  updateProfile: (data: Partial<UserInfo> & { id: number }) => request.patch(`/user/profile/${data.id}`, data),
}
