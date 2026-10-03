import type {
  ConfigProviderProps,
  DialogApi,
  DialogOptions,
  MessageApi,
  MessageReactive,
} from 'naive-ui'
import type { ComputedRef, VNodeChild } from 'vue'
import type { KeyedMessageOptions, WrappedDialog, WrappedMessage } from '@/types/global'
import * as NaiveUI from 'naive-ui'
import { useAppStore } from '@/store'
import { isNullOrUndef } from '@/utils'

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

    showMessage(type: MessageType, content: string | string[], option: KeyedMessageOptions = {}): MessageReactive | undefined {
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

    loading(content: string | string[], option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('loading', content, option)
      return undefined
    }

    success(content: string | string[] | (() => VNodeChild), option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('success', content as string, option)
      return undefined
    }

    error(content: string | string[], option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('error', content, option)
      return undefined
    }

    info(content: string | string[], option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('info', content, option)
      return undefined
    }

    warning(content: string | string[], option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('warning', content, option)
      return undefined
    }
  }

  return new Message()
}

export function setupDialog(NDialog: DialogApi): WrappedDialog {
  // 给 confirm 挂上简化版 confirm/cancel 回调（WrappedDialog 的扩展字段）
  const dialog = NDialog as WrappedDialog
  dialog.confirm = function (option: Partial<DialogOptions> & { confirm?: () => void, cancel?: () => void } = {}) {
    const showIcon = !isNullOrUndef(option.title)
    // DialogOptions['type'] 含 'default'，DialogApi 无对应方法，索引断言绕过
    return (NDialog as any)[option.type || 'warning']({
      showIcon,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: option.confirm,
      onNegativeClick: option.cancel,
      onMaskClick: option.cancel,
      ...option,
    }) as any
  }

  return dialog
}

export function setupNaiveDiscreteApi(): void {
  const appStore = useAppStore()
  // naive-ui 的 GlobalThemeOverrides 与 ConfigProviderProps['themeOverrides'] 存在深层型变不兼容（官方已知类型缺陷），
  // 文档写法 computed<ConfigProviderProps> 在本版本编译不过，故用断言
  const configProviderProps = computed(() => ({
    theme: appStore.isDark ? NaiveUI.darkTheme : undefined,
    themeOverrides: useAppStore().naiveThemeOverrides,
  })) as unknown as ComputedRef<ConfigProviderProps>
  const { message, dialog, notification, loadingBar } = NaiveUI.createDiscreteApi(
    ['message', 'dialog', 'notification', 'loadingBar'],
    { configProviderProps },
  )

  window.$loadingBar = loadingBar
  window.$notification = notification
  window.$message = setupMessage(message)
  window.$dialog = setupDialog(dialog)
}
