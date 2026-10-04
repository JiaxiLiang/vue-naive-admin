import type { MessageApi, MessageReactive } from 'naive-ui'
import type { KeyedMessageOptions } from '@/types/global'
import { describe, expect, it, vi } from 'vitest'
import { setupDialog, setupMessage } from '@/utils/naiveTools'

/** 构造受控的 MessageApi 桩：记录调用并返回可断言的 reactive */
function createMessageApi() {
  const calls: Array<{ type: string, content: unknown, option: unknown }> = []
  const makeReactive = (type: string, content: unknown): MessageReactive => ({
    type,
    content,
    destroy: vi.fn(),
  } as MessageReactive)
  const api = Object.fromEntries(
    ['loading', 'success', 'error', 'info', 'warning'].map(type => [
      type,
      (content: never, option?: never) => {
        calls.push({ type, content, option })
        return makeReactive(type, content)
      },
    ]),
  ) as MessageApi
  return { api, calls }
}

describe('setupMessage（Message 包装层）', () => {
  it('单条消息直通底层 API', () => {
    const { api, calls } = createMessageApi()
    const message = setupMessage(api)
    message.success('已保存')
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ type: 'success', content: '已保存' })
  })

  it('数组内容批量弹出', () => {
    const { api, calls } = createMessageApi()
    const message = setupMessage(api)
    const res = message.error(['第一', '第二'])
    expect(calls).toHaveLength(2)
    expect(res).toBeUndefined()
  })

  it('带 key 的消息复用同一条 reactive（改 type/content，不新开）', () => {
    vi.useFakeTimers()
    const { api, calls } = createMessageApi()
    const message = setupMessage(api)
    const option: KeyedMessageOptions = { key: 'login' }

    message.loading('正在登录', option)
    expect(calls).toHaveLength(1)
    message.success('登录成功', option) // 复用：不再新调底层 API
    expect(calls).toHaveLength(1)
    expect(message).toBeDefined()

    // removeMessage 默认 5 秒后销毁
    vi.advanceTimersByTime(5100)
    vi.useRealTimers()
  })

  it('无 key 时每次新开一条', () => {
    const { api, calls } = createMessageApi()
    const message = setupMessage(api)
    message.info('a')
    message.info('b')
    expect(calls).toHaveLength(2)
  })
})

describe('setupDialog（Dialog 包装层）', () => {
  it('confirm 透传 confirm/cancel 回调到 onPositiveClick/onNegativeClick', () => {
    const record: Array<Record<string, unknown>> = []
    const NDialog = {
      warning: (option: Record<string, unknown>) => {
        record.push(option)
        return { destroy: vi.fn() }
      },
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    } as never
    const dialog = setupDialog(NDialog)

    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    dialog.confirm({ type: 'warning', title: '删除', content: '确定删除？', confirm: onConfirm, cancel: onCancel })

    const option = record[0]
    expect(option.showIcon).toBe(true)
    expect(option.positiveText).toBe('确定')
    expect(option.negativeText).toBe('取消')
    ;(option.onPositiveClick as () => void)()
    ;(option.onNegativeClick as () => void)()
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('type 缺省回退 warning；无 title 时不带图标', () => {
    const record: Array<Record<string, unknown>> = []
    const NDialog = {
      warning: (option: Record<string, unknown>) => {
        record.push(option)
        return { destroy: vi.fn() }
      },
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    } as never
    const dialog = setupDialog(NDialog)
    dialog.confirm({ content: '提示' })
    expect(record[0].showIcon).toBe(false)
    // 回退到 warning 分发（通过 NDialog.warning 被调用证实）
    expect(record).toHaveLength(1)
  })
})
