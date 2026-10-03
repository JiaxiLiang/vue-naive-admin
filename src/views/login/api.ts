import type { LoginToken, UserInfo } from '@/types/models'
import { request } from '@/utils'

export default {
  /** 该方法目前无调用方（角色切换实际走 @/api 的 switchCurrentRole），payload 形状未知，保持宽松 */
  toggleRole: (data: Record<string, unknown>) => request.post('/auth/role/toggle', data),
  login: (data: { username: string, password: string, captcha?: string, isQuick?: boolean }) =>
    request.post<LoginToken>('/auth/login', data, { needToken: false }),
  getUser: () => request.get<UserInfo>('/user/detail'),
}
