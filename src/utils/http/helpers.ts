import { useAuthStore } from '@/store'

let isConfirming = false
// 认证过期时弹出"是否重新登录"确认框（带防重复锁）
function handleAuthExpired(content: string, needTip: boolean): false {
  if (isConfirming || !needTip)
    return false
  isConfirming = true
  $dialog.confirm({
    title: '提示',
    type: 'info',
    content,
    confirm() {
      useAuthStore().logout()
      window.$message?.success('已退出登录')
      isConfirming = false
    },
    cancel() {
      isConfirming = false
    },
  })
  return false
}

// 解析响应错误  拦截器调用
// 注意：断网等场景 axios 的 error.code 是字符串（如 'ERR_NETWORK'），所以 code 参数放宽为 number | string
export function resolveResError(code: number | string, message?: string, needTip = true): string | false {
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
