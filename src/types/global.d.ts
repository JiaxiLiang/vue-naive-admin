import type {
  DialogApi,
  DialogOptions,
  DialogReactive,
  LoadingBarApi,
  MessageOptions,
  MessageReactive,
  NotificationApi,
} from 'naive-ui'
import type { VNodeChild } from 'vue'

/** naive-ui 运行时支持 key 来复用/合并同一条 message，但 MessageOptions 类型未声明该字段，项目里大量使用，故在此补充 */
export type KeyedMessageOptions = MessageOptions & { key?: string | number, duration?: number }

/** 包装层消息内容：字符串、数组批量、或渲染函数 */
export type WrappedMessageContent = string | string[] | (() => VNodeChild)

/** setupMessage 包装后的 message（比原生多 key 复用/延时销毁能力；content 支持数组批量弹出） */
export interface WrappedMessage {
  loading: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  success: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  error: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  info: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  warning: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  /** 按 key 延时销毁消息（login 页验证码错误等场景使用） */
  destroy: (key: string, duration?: number) => void
}

/**
 * setupDialog 扩展后的 dialog：confirm 支持简化版 confirm/cancel 回调。
 * type 收窄到有离散方法（info/success/warning/error）的四类；'default' 无对应方法，从入参排除。
 */
export type WrappedDialog = DialogApi & {
  confirm: (option?: Partial<Omit<DialogOptions, 'type'>> & {
    type?: 'info' | 'success' | 'warning' | 'error'
    confirm?: () => void
    cancel?: () => void
  }) => DialogReactive
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
