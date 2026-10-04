import { describe, expect, it, vi } from 'vitest'
import { useEnableRow } from '@/composables/useEnableRow'

describe('useEnableRow 行状态开关', () => {
  it('成功：翻转 enable 调 update，成功提示并刷新，loading 复位', async () => {
    const update = vi.fn(async () => ({ code: 200, message: 'ok', data: null }))
    const onUpdated = vi.fn()
    const { handleEnable } = useEnableRow(update, onUpdated)
    window.$message = { success: vi.fn() } as never

    const row = { id: 1, enable: false, enableLoading: false }
    await handleEnable(row)

    expect(update).toHaveBeenCalledWith({ id: 1, enable: true })
    expect(onUpdated).toHaveBeenCalledTimes(1)
    expect(row.enableLoading).toBe(false)
  })

  it('失败：loading 复位，不提示成功、不刷新', async () => {
    const update = vi.fn(async () => {
      throw new Error('x')
    })
    const onUpdated = vi.fn()
    const { handleEnable } = useEnableRow(update, onUpdated)
    window.$message = { success: vi.fn() } as never

    const row = { id: 1, enable: true, enableLoading: false }
    await handleEnable(row)

    expect(onUpdated).not.toHaveBeenCalled()
    expect(row.enableLoading).toBe(false)
  })
})
