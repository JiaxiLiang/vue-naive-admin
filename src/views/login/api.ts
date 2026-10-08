import type { LoginToken } from '@/types/models'
import { request } from '@/utils'

export default {
  // 用户登录：username 用户名，password 密码，captcha 图形验证码，isQuick 为 true 时走免验证码的快捷登录；返回 token 信息
  login: (data: { username: string, password: string, captcha?: string, isQuick?: boolean }) =>
    request.post<LoginToken>('/auth/login', data, { needToken: false }),
}
