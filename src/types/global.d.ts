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

/** naive-ui 运行时支持用 key 复用/合并消息，但 MessageOptions 类型未声明该字段，项目大量使用，在此补充 */
export type KeyedMessageOptions = MessageOptions & { key?: string | number, duration?: number }

/** 包装层消息内容：字符串、数组（批量弹出）或渲染函数 */
export type WrappedMessageContent = string | string[] | (() => VNodeChild)

/** setupMessage 包装后的 message：content 支持数组批量弹出，且具备 key 复用与延时销毁能力 */
export interface WrappedMessage {
  loading: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  success: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  error: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  info: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  warning: (content: WrappedMessageContent, option?: KeyedMessageOptions) => MessageReactive | undefined
  /** 按 key 延时销毁指定消息（如登录页验证码错误提示） */
  destroy: (key: string, duration?: number) => void
}

/**
 * setupDialog 包装后的 dialog：confirm 支持简化版 confirm/cancel 回调。
 * type 收窄为 info/success/warning/error 四类（有对应离散方法），'default' 无对应方法故从入参排除
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
  // 业务代码以裸标识符调用（$message.success(...) 而非 window.$message），故声明全局 var
  // eslint-disable-next-line vars-on-top
  var $message: WrappedMessage
  // eslint-disable-next-line vars-on-top
  var $dialog: WrappedDialog
  // eslint-disable-next-line vars-on-top
  var $notification: NotificationApi
  // eslint-disable-next-line vars-on-top
  var $loadingBar: LoadingBarApi
}

export {}
