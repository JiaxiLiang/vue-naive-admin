import { getHttpAuth } from './index'

let isConfirming = false

/** 会话过期时弹"是否重新登录"确认框；isConfirming 锁防多个失败请求同时触发重复弹窗 */
function handleAuthExpired(content: string, needTip: boolean): false {
  if (isConfirming || !needTip)
    return false
  isConfirming = true
  $dialog.confirm({
    title: '提示',
    type: 'info',
    content,
    confirm() {
      getHttpAuth().logout()
      window.$message?.success('已退出登录')
      isConfirming = false
    },
    cancel() {
      isConfirming = false
    },
  })
  return false
}

/**
 * 解析响应错误并弹全局提示（拦截器调用），返回提示文案。
 * code 的三种来源：HTTP 状态码、后端业务码、axios 错误码（断网为 'ERR_NETWORK' 类字符串），
 * 未命中任何来源时为 undefined。
 * 登录过期类（401/11007/11008）改走重登确认框并返回 false——表示已进入登出流程，
 * 调用方无需再弹普通错误提示
 */
export function resolveResError(code: number | string | undefined, message?: string, needTip = true): string | false {
  let tip: string
  switch (code) {
    case 401:
      return handleAuthExpired('登录已过期，是否重新登录？', needTip)
    case 11007:
    case 11008:
      return handleAuthExpired(`${message}，是否重新登录？`, needTip)
    case 403:
      tip = '请求被拒绝'
      break
    case 404:
      tip = '请求资源或接口不存在'
      break
    case 500:
      tip = '服务器发生异常'
      break
    default:
      // 优先展示后端给的 message，没有再用 code 兜底
      tip = message ?? `【${code}】: 未知异常!`
      break
  }
  needTip && window.$message?.error(tip)
  return tip
}
