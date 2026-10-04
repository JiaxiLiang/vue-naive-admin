import { describe, expect, it, vi } from 'vitest'
import { useModal } from '@/composables/useModal'

describe('useModal 弹窗遥控器', () => {
  it('未挂载时 okLoading 读值为 false', () => {
    const [modalRef, okLoading] = useModal()
    expect(modalRef.value).toBeNull()
    expect(okLoading.value).toBe(false)
  })

  it('未挂载时写 okLoading 抛 TypeError（保留原行为，非静默 no-op）', () => {
    const [, okLoading] = useModal()
    expect(() => (okLoading.value = true)).toThrow(TypeError)
  })

  it('挂载后 okLoading 读写在弹窗实例上透传', () => {
    const [modalRef, okLoading] = useModal()
    const exposed = {
      open: vi.fn(async () => {}),
      close: vi.fn(),
      handleOk: vi.fn(async () => {}),
      handleCancel: vi.fn(async () => {}),
      okLoading: false,
      options: {},
    }
    modalRef.value = exposed
    okLoading.value = true
    expect(exposed.okLoading).toBe(true)
    expect(okLoading.value).toBe(true)
  })
})
