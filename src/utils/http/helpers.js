import { useAuthStore } from '@/store' // 引入认证状态管理仓库

let isConfirming = false // 定义锁变量，防止重复弹窗

function handleAuthExpired(content, needTip) { // 处理认证过期的函数 参数（消息 提示）
  if (isConfirming || !needTip) // 如果正在确认中或不需要提示
    return // 直接返回，不执行后续逻辑
  isConfirming = true // 开启锁，防止后续请求重复触发弹窗
  $dialog.confirm({
    // $dialog是vue中对话框对象
    // 调用confirm全局对话框组件 看到$就是全局变量 挂载在vue实例
    title: '提示', // 标题
    type: 'info', // 类型
    content, // 内容
    confirm() { // 用户点击确认的回调
      useAuthStore().logout() // 调用 store 的退出登录 清除数据
      window.$message?.success('已退出登录')
      // 显示成功提示（可选链防止报错）
      // window是全局对象 window.document win就是整个浏览器窗口 doc是窗口显示的页面内容
      // $message消息提示对象 success成功提示方法
      // 正常来说全局变量都得要Windows调用 $dialog没有是因为全局作用域可以省略这里就不行
      isConfirming = false // 关闭锁，恢复状态
    },
    cancel() { // 用户点击取消的回调
      isConfirming = false // 关闭锁，恢复状态
    },
    /*
        confirm() { ... }
    // 等同于
    confirm: function() { ... } 所以前两个本质上就是对他们的属性进行配置只不过配置的只是函数
    */
  })
  return false // 返回 false 表示中断后续流程
}

export function resolveResError(code, message, needTip = true) { // 导出解析响应错误的函数
  switch (code) { // 根据错误码进行逻辑分发
    case 401: // 未授权（未登录或 token 失效）
      return handleAuthExpired('登录已过期，是否重新登录？', needTip) // 调用过期处理函数
    case 11007: // 特定的业务鉴权错误码
    case 11008:
      return handleAuthExpired(`${message}，是否重新登录？`, needTip) // 调用过期处理函数并携带后端消息
    case 403: // 禁止访问（无权限）
      message = '请求被拒绝' // 重写提示消息
      break // 跳出 switch
    case 404: // 资源未找到
      message = '请求资源或接口不存在' // 重写提示消息
      break // 跳出 switch
    case 500: // 服务器内部错误
      message = '服务器发生异常' // 重写提示消息
      break // 跳出 switch
    default: // 其他未知异常
      message = message ?? `【${code}】: 未知异常!` // 拼接消息或使用默认消息
      break // 跳出 switch
  }
  needTip && window.$message?.error(message)
  // 如果需要提示，则调用全局消息组件弹窗
  // error错误方法
  return message // 返回处理后的错误信息
}
/*
switch (expression) {
  case value1:
    // expression 等于 value1 时执行的代码
    break;
  case value2:
    // expression 等于 value2 时执行的代码
    break;
  // ... 可包含多个 case
  default:
    // 无匹配 case 时执行的代码（类似 if-else 的 else）
}

*/
