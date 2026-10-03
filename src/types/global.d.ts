import type {
  DialogApiInjection,
  DialogOptions,
  LoadingBarApi,
  MessageOptions,
  MessageReactive,
  NotificationApi,
} from 'naive-ui'
import type { VNodeChild } from 'vue'

/** setupMessage 包装后的 message（比原生多 key 复用/延时销毁能力） */
export interface WrappedMessage {
  loading: (content: string, option?: MessageOptions) => MessageReactive | undefined
  success: (content: string | (() => VNodeChild), option?: MessageOptions) => MessageReactive | undefined
  error: (content: string, option?: MessageOptions) => MessageReactive | undefined
  info: (content: string, option?: MessageOptions) => MessageReactive | undefined
  warning: (content: string, option?: MessageOptions) => MessageReactive | undefined
}

/** setupDialog 扩展后的 dialog：confirm 支持简化版 confirm/cancel 回调 */
export type WrappedDialog = DialogApiInjection & {
  confirm: (option: Partial<DialogOptions> & {
    confirm?: () => void
    cancel?: () => void
  }) => MessageReactive | undefined
}

declare global {
  interface Window {
    $message: WrappedMessage
    $dialog: WrappedDialog
    $notification: NotificationApi
    $loadingBar: LoadingBarApi
  }
  // 裸标识符写法（代码里大量存在 $message.success(...) 而不是 window.$message）
  // eslint-disable-next-line vars-on-top -- d.ts 环境声明必须用 var
  var $message: WrappedMessage
  // eslint-disable-next-line vars-on-top -- d.ts 环境声明必须用 var
  var $dialog: WrappedDialog
  // eslint-disable-next-line vars-on-top -- d.ts 环境声明必须用 var
  var $notification: NotificationApi
  // eslint-disable-next-line vars-on-top -- d.ts 环境声明必须用 var
  var $loadingBar: LoadingBarApi
}

export {}
