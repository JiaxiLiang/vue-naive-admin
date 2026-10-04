import type {
  ConfigProviderProps,
  DialogApi,
  MessageApi,
  MessageReactive,
} from 'naive-ui'
import type { ComputedRef } from 'vue'
import type { KeyedMessageOptions, WrappedDialog, WrappedMessage, WrappedMessageContent } from '@/types/global'
import * as NaiveUI from 'naive-ui'
import { isNullOrUndef } from '@/utils/is'

type MessageType = 'loading' | 'success' | 'error' | 'info' | 'warning'

export function setupMessage(NMessage: MessageApi): WrappedMessage {
  class Message {
    static instance: Message | undefined
    private message!: Record<string, MessageReactive>
    private removeTimer!: Record<string, ReturnType<typeof setTimeout>>

    constructor() {
      // 单例模式
      if (Message.instance)
        return Message.instance
      Message.instance = this
      this.message = {}
      this.removeTimer = {}
    }

    removeMessage(key: string, duration = 5000): void {
      this.removeTimer[key] && clearTimeout(this.removeTimer[key])
      this.removeTimer[key] = setTimeout(() => {
        this.message[key]?.destroy()
      }, duration)
    }

    destroy(key: string, duration = 200): void {
      setTimeout(() => {
        this.message[key]?.destroy()
      }, duration)
    }

    showMessage(type: MessageType, content: WrappedMessageContent, option: KeyedMessageOptions = {}): MessageReactive | undefined {
      if (Array.isArray(content)) {
        content.forEach(msg => NMessage[type](msg, option))
        return undefined
      }

      if (!option.key) {
        return NMessage[type](content, option)
      }

      const currentMessage = this.message[option.key]
      if (currentMessage) {
        currentMessage.type = type
        currentMessage.content = content
      }
      else {
        this.message[option.key] = NMessage[type](content, {
          ...option,
          duration: 0,
          onAfterLeave: () => {
            delete this.message[option.key!]
          },
        })
      }
      this.removeMessage(option.key as string, option.duration)
      return undefined
    }

    loading(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('loading', content, option)
      return undefined
    }

    success(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('success', content, option)
      return undefined
    }

    error(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('error', content, option)
      return undefined
    }

    info(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('info', content, option)
      return undefined
    }

    warning(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('warning', content, option)
      return undefined
    }
  }

  return new Message()
}

export function setupDialog(NDialog: DialogApi): WrappedDialog {
  // 各类型弹窗 API 的分发表：DialogOptions['type'] 中的 'default' 没有对应的离散方法，
  // 直接在 confirm 的入参类型里排除，运行时索引恒安全
  const apiByType = {
    info: NDialog.info,
    success: NDialog.success,
    warning: NDialog.warning,
    error: NDialog.error,
  } as const

  // 给 confirm 挂上简化版 confirm/cancel 回调（WrappedDialog 的扩展字段）
  // 断言依据：confirm 由下一行立即挂载，返回值满足 WrappedDialog 契约
  const dialog = NDialog as WrappedDialog
  dialog.confirm = function (option = {}) {
    const showIcon = !isNullOrUndef(option.title)
    return apiByType[option.type ?? 'warning']({
      showIcon,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: option.confirm,
      onNegativeClick: option.cancel,
      onMaskClick: option.cancel,
      ...option,
    })
  }

  return dialog
}

/**
 * 装配 naive 离散 API（$message/$dialog/$notification/$loadingBar 挂到 window）。
 * 主题以 ComputedRef 形式由调用方注入（应用入口在 store 就绪后装配），utils 不反向依赖 store。
 */
export function setupNaiveDiscreteApi(configProviderProps: ComputedRef<ConfigProviderProps>): void {
  const { message, dialog, notification, loadingBar } = NaiveUI.createDiscreteApi(
    ['message', 'dialog', 'notification', 'loadingBar'],
    { configProviderProps },
  )

  window.$loadingBar = loadingBar
  window.$notification = notification
  window.$message = setupMessage(message)
  window.$dialog = setupDialog(dialog)
}
