import type { MeModalExposed } from '@/types/me-components'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCrud } from '@/composables/useCrud'

function stubDialogWarning() {
  const captured: Array<Record<string, unknown>> = []
  const dialogReactive = { loading: false }
  window.$dialog = {
    warning: (option: Record<string, unknown>) => {
      captured.push(option)
      return dialogReactive
    },
    confirm: vi.fn(),
  } as never
  return { captured, dialogReactive }
}

function stubMessage() {
  window.$message = {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    destroy: vi.fn(),
  }
}

/** 满足 MeModalExposed 的受控弹窗实例（挂到 useModal 的 ref 上） */
function createExposedModal(): MeModalExposed {
  const exposed = {
    open: vi.fn(async () => {}),
    close: vi.fn(),
    handleOk: vi.fn(async () => {}),
    handleCancel: vi.fn(async () => {}),
    okLoading: false,
    options: {},
  }
  return exposed satisfies MeModalExposed
}

interface TestRow {
  name?: string
  id?: number
}

function setupCrud(overrides: Partial<Parameters<typeof useCrud<TestRow>>[0]> = {}) {
  return useCrud<TestRow>({
    name: '测试',
    doCreate: vi.fn(async () => ({ code: 200, message: 'ok', data: null })),
    doDelete: vi.fn(async () => ({ code: 200, message: 'ok', data: null })),
    doUpdate: vi.fn(async () => ({ code: 200, message: 'ok', data: null })),
    refresh: vi.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  stubMessage()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useCrud 状态机与弹窗装配', () => {
  it('handleAdd/handleEdit/handleView 设置动作与表单，并弹出标题正确的弹窗', async () => {
    const crud = setupCrud()
    crud.modalRef.value = createExposedModal()

    crud.handleAdd({ name: '新值' })
    expect(crud.modalAction.value).toBe('add')
    expect(crud.modalForm.value).toEqual({ name: '新值' })
    expect(crud.modalRef.value.open).toHaveBeenCalled()
    const addOptions = (crud.modalRef.value.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as { title: string }
    expect(addOptions.title).toBe('新增测试')

    crud.handleEdit({ id: 1, name: '行数据' })
    expect(crud.modalAction.value).toBe('edit')
    expect(crud.modalForm.value).toEqual({ id: 1, name: '行数据' })

    crud.handleView({ id: 2 })
    expect(crud.modalAction.value).toBe('view')
  })

  it('handleAdd 会合并 initForm（新增表单带初始值）', () => {
    const crud = setupCrud({ initForm: { name: '默认名' } })
    crud.modalRef.value = createExposedModal()
    crud.handleAdd()
    expect(crud.modalForm.value).toEqual({ name: '默认名' })
  })

  it('handleOpen 未传 action 时标题只有后缀（ACTIONS 无匹配回退空串）', () => {
    const crud = setupCrud()
    crud.modalRef.value = createExposedModal()
    crud.handleOpen({ row: {} })
    expect(crud.modalAction.value).toBe('')
    const options = (crud.modalRef.value.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as { title: string }
    expect(options.title).toBe('测试')
  })

  it('扩展动作（reset/setRole 等）可自由传入', () => {
    const crud = setupCrud()
    crud.modalRef.value = createExposedModal()
    crud.handleOpen({ action: 'setRole', row: { id: 1 } })
    expect(crud.modalAction.value).toBe('setRole')
  })
})

describe('useCrud handleSave', () => {
  it('非 add/edit 动作且无自定义 action 时守卫直接返回 false', async () => {
    const crud = setupCrud()
    crud.modalAction.value = 'view'
    await expect(crud.handleSave()).resolves.toBe(false)
  })

  it('add 分支：调 doCreate → 成功提示 → refresh；okLoading 置位复位', async () => {
    const doCreate = vi.fn(async () => ({ code: 200, message: 'ok', data: { n: 1 } }))
    const refresh = vi.fn()
    const crud = setupCrud({ doCreate, refresh })
    crud.modalRef.value = createExposedModal()
    crud.handleAdd()
    await expect(crud.handleSave()).resolves.toBe(true)
    expect(doCreate).toHaveBeenCalledTimes(1)
    expect(window.$message.success).toHaveBeenCalledWith('新增成功')
    expect(refresh).toHaveBeenCalledWith({ code: 200, message: 'ok', data: { n: 1 } })
    expect(crud.okLoading.value).toBe(false)
  })

  it('edit 分支：调 doUpdate 且表单带 id', async () => {
    const doUpdate = vi.fn(async () => ({ code: 200, message: 'ok', data: null }))
    const crud = setupCrud({ doUpdate })
    crud.modalRef.value = createExposedModal()
    crud.handleEdit({ id: 7, name: 'x' })
    await crud.handleSave()
    expect(doUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
    expect(window.$message.success).toHaveBeenCalledWith('保存成功')
  })

  it('api 失败：返回 false，不提示成功，okLoading 复位', async () => {
    const doCreate = vi.fn(async () => {
      throw new Error('boom')
    })
    const crud = setupCrud({ doCreate })
    crud.modalRef.value = createExposedModal()
    crud.handleAdd()
    await expect(crud.handleSave()).resolves.toBe(false)
    expect(window.$message.success).not.toHaveBeenCalled()
    expect(crud.okLoading.value).toBe(false)
  })

  it('自定义 SaveAction 绕过 add/edit 守卫（reset/setRole 场景）', async () => {
    const api = vi.fn(async () => ({ code: 200, message: 'ok', data: null }))
    const cb = vi.fn()
    const crud = setupCrud()
    crud.modalRef.value = createExposedModal()
    crud.modalAction.value = 'reset'
    await crud.handleSave({ api, cb })
    expect(api).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('useCrud handleDelete', () => {
  it('空 id（undefined/空串）静默返回，不弹确认框', () => {
    const doDelete = vi.fn()
    const { captured } = stubDialogWarning()
    const crud = setupCrud({ doDelete })
    crud.handleDelete(undefined)
    crud.handleDelete('')
    expect(captured).toHaveLength(0)
    expect(doDelete).not.toHaveBeenCalled()
  })

  it('确认删除：置 loading → 调 doDelete → 提示 → refresh(数据, true) → 复位', async () => {
    const doDelete = vi.fn(async () => ({ code: 200, message: 'ok', data: null }))
    const refresh = vi.fn()
    const { captured, dialogReactive } = stubDialogWarning()
    const crud = setupCrud({ doDelete, refresh })
    crud.handleDelete(3)
    expect(captured).toHaveLength(1)
    const onPositiveClick = captured[0].onPositiveClick as () => Promise<void>
    await onPositiveClick()
    expect(doDelete).toHaveBeenCalledWith(3)
    expect(window.$message.success).toHaveBeenCalledWith('删除成功')
    expect(refresh).toHaveBeenCalledWith({ code: 200, message: 'ok', data: null }, true)
    expect(dialogReactive.loading).toBe(false)
  })

  it('删除失败：不提示成功，loading 复位', async () => {
    const doDelete = vi.fn(async () => {
      throw new Error('fail')
    })
    const { captured, dialogReactive } = stubDialogWarning()
    const crud = setupCrud({ doDelete })
    crud.handleDelete(3)
    await (captured[0].onPositiveClick as () => Promise<void>)()
    expect(window.$message.success).not.toHaveBeenCalled()
    expect(dialogReactive.loading).toBe(false)
  })
})
