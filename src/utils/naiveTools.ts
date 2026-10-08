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

/**
 * 包装 naive 的 message API：新增按 key 复用更新与延迟销毁能力，
 * 同 key 消息只原地更新内容，不堆叠新条（轮询/连续操作场景不刷屏）
 * @param NMessage naive 原始 message API
 * @returns 包装后的 $message
 */
export function setupMessage(NMessage: MessageApi): WrappedMessage {
  class Message {
    static instance: Message | undefined
    private message!: Record<string, MessageReactive>
    private removeTimer!: Record<string, ReturnType<typeof setTimeout>>

    constructor() {
      // 单例：重复装配时返回首个实例，避免包装层重复叠加
      if (Message.instance)
        return Message.instance
      Message.instance = this
      this.message = {}
      this.removeTimer = {}
    }

    /** duration 毫秒后销毁指定 key 的消息；重复调用先清旧定时器，以最后一次计时为准 */
    removeMessage(key: string, duration = 5000): void {
      this.removeTimer[key] && clearTimeout(this.removeTimer[key])
      this.removeTimer[key] = setTimeout(() => {
        this.message[key]?.destroy()
      }, duration)
    }

    /** 延迟 duration 毫秒后强制销毁消息（不进定时器表、不可被后续调用取消，区别于 removeMessage） */
    destroy(key: string, duration = 200): void {
      setTimeout(() => {
        this.message[key]?.destroy()
      }, duration)
    }

    /**
     * 展示消息。数组内容逐条直发不登记；带 key 时复用已有常驻实例原地更新 type/content，
     * 无 key 或首次出现才新建；常驻实例的关闭时机统一交给 removeMessage 的定时器收口
     */
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
          // duration:0 让消息常驻，关闭时机交给 removeMessage 的定时器，这样同 key 才能做到就地更新
          duration: 0,
          onAfterLeave: () => {
            delete this.message[option.key!]
          },
        })
      }
      this.removeMessage(option.key as string, option.duration)
      return undefined
    }

    /** loading 提示（key 复用逻辑同 showMessage） */
    loading(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('loading', content, option)
      return undefined
    }

    /** success 提示 */
    success(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('success', content, option)
      return undefined
    }

    /** error 提示 */
    error(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('error', content, option)
      return undefined
    }

    /** info 提示 */
    info(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('info', content, option)
      return undefined
    }

    /** warning 提示 */
    warning(content: WrappedMessageContent, option?: KeyedMessageOptions): MessageReactive | undefined {
      this.showMessage('warning', content, option)
      return undefined
    }
  }

  return new Message()
}

/**
 * 包装 naive 的 dialog API：新增简化版 confirm——直接传 title/type 与 confirm/cancel
 * 回调即可得到带确定/取消按钮的确认框
 * @param NDialog naive 原始 dialog API
 * @returns 挂上 confirm 的增强 dialog
 */
export function setupDialog(NDialog: DialogApi): WrappedDialog {
  // 类型→离散方法的分发表：DialogOptions['type'] 中的 'default' 没有对应离散方法，
  // 已在 confirm 的入参类型里排除，运行时索引恒安全
  const apiByType = {
    info: NDialog.info,
    success: NDialog.success,
    warning: NDialog.warning,
    error: NDialog.error,
  } as const

  // 断言依据：confirm 由下一行立即挂载，返回值满足 WrappedDialog 契约
  const dialog = NDialog as WrappedDialog
  dialog.confirm = function (option = {}) {
    // 无标题的轻提示形态不显示图标
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
 * 装配 naive 离散 API 并挂到 window（$message/$dialog/$notification/$loadingBar），
 * 让 store、http 层等非组件环境也能弹提示。主题以 ComputedRef 形式由调用方注入
 * （应用入口在 store 就绪后装配），utils 不反向依赖 store
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
