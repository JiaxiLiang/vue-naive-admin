import type { LoginToken } from '@/types/models'
import { request } from '@/utils'

export default {
  login: (data: { username: string, password: string, captcha?: string, isQuick?: boolean }) =>
    request.post<LoginToken>('/auth/login', data, { needToken: false }),
}
