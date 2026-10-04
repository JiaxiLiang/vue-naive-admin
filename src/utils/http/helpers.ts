import { getHttpAuth } from './index'

let isConfirming = false
// 会话过期时弹出"是否重新登录"确认框（带防重复弹窗锁：确认框停留期间不重复弹）
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

// 解析响应错误，拦截器调用
// code 的三种来源：HTTP 状态码（数字）、后端业务码（数字）、axios 错误码（断网时是 'ERR_NETWORK' 这类字符串），未命中任何来源时为 undefined
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
      tip = message ?? `【${code}】: 未知异常!`
      break
  }
  needTip && window.$message?.error(tip)
  return tip
}
