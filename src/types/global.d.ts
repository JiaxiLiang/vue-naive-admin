import type {
  DialogApi,
  DialogOptions,
  LoadingBarApi,
  MessageOptions,
  MessageReactive,
  NotificationApi,
} from 'naive-ui'
import type { VNodeChild } from 'vue'

/** naive-ui 运行时支持 key 来复用/合并同一条 message，但 MessageOptions 类型未声明该字段，项目里大量使用，故在此补充 */
export type KeyedMessageOptions = MessageOptions & { key?: string | number }

/** setupMessage 包装后的 message（比原生多 key 复用/延时销毁能力；content 支持数组批量弹出） */
export interface WrappedMessage {
  loading: (content: string | string[], option?: KeyedMessageOptions) => MessageReactive | undefined
  success: (content: string | string[] | (() => VNodeChild), option?: KeyedMessageOptions) => MessageReactive | undefined
  error: (content: string | string[], option?: KeyedMessageOptions) => MessageReactive | undefined
  info: (content: string | string[], option?: KeyedMessageOptions) => MessageReactive | undefined
  warning: (content: string | string[], option?: KeyedMessageOptions) => MessageReactive | undefined
  /** 按 key 延时销毁消息（login 页验证码错误等场景使用） */
  destroy: (key: string, duration?: number) => void
}

/** setupDialog 扩展后的 dialog：confirm 支持简化版 confirm/cancel 回调 */
export type WrappedDialog = DialogApi & {
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
