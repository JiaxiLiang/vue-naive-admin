//  把useModal()  useForm()组合封装成useCrud()
// 把 CRUD 页面的全部交互动作（新增/编辑/查看/删除/保存/开弹窗）封装成一个函数
import type { DialogOptions } from 'naive-ui'
import type { ModalOptions } from '@/types/me-components'
import type { ApiResult } from '@/utils/http'
import { cloneDeep } from 'lodash-es'
import { useForm, useModal } from '.'

/** 弹窗用途标识。内置三种，业务页可传任意扩展值（如 'reset'、'setRole'，见 user 页） */
export type ModalAction = 'view' | 'edit' | 'add' | (string & {})

const ACTIONS: Record<ModalAction, string> = {
  view: '查看',
  edit: '编辑',
  add: '新增',
}

/** handleSave 的自定义动作（user 页 onSave 的 reset/setRole 分支传的就是它） */
export interface SaveAction {
  api: () => Promise<ApiResult<unknown>>
  cb: () => void
}

export interface UseCrudOptions<T extends object> {
  /** 弹窗标题后缀，如 name: '用户' → '新增用户' */
  name: string
  initForm?: Partial<T>
  doCreate: (data: Partial<T>) => Promise<ApiResult<unknown>>
  doDelete: (id: number | string) => Promise<ApiResult<unknown>>
  doUpdate: (data: Partial<T> & { id?: number }) => Promise<ApiResult<unknown>>
  /** 保存/删除成功后的刷新回调；第二参数含义见各页 refresh 实现（keepCurrentPage） */
  refresh: (data?: unknown, keepCurrentPage?: boolean) => void
}

export function useCrud<T extends object>(options: UseCrudOptions<T>) {
  const { name, initForm, doCreate, doDelete, doUpdate, refresh } = options

  const modalAction = ref<ModalAction>('')
  const [modalRef, okLoading] = useModal()
  // 显式传 Partial<T>：泛型内的解构默认值会让 TS 把 initForm 推断成 {}，导致 modalForm 丢失字段类型
  const [modalFormRef, modalForm, validation] = useForm<Partial<T>>(initForm ?? {})

  /** 新增 */
  function handleAdd(row: Partial<T> = {}, title?: string) {
    handleOpen({ action: 'add', title, row: Object.assign({}, cloneDeep(initForm), cloneDeep(row)) })
  }

  /** 修改 */
  function handleEdit(row: Partial<T>, title?: string) {
    handleOpen({ action: 'edit', title, row })
  }

  /** 查看 */
  function handleView(row: Partial<T>, title?: string) {
    handleOpen({ action: 'view', title, row })
  }

  /** 打开modal */
  function handleOpen(options: ModalOptions & { action?: ModalAction, row?: Partial<T> } = {}) {
    const { action, row, title, onOk } = options
    modalAction.value = action ?? ''
    modalForm.value = { ...row }
    modalRef.value?.open({
      ...options,
      async onOk() {
        if (typeof onOk === 'function') {
          return await onOk()
        }
        else {
          return await handleSave()
        }
      },
      title: title ?? (ACTIONS[modalAction.value] || '') + name,
    })
  }

  /** 保存 */
  async function handleSave(action?: SaveAction): Promise<boolean | undefined> {
    // 无自定义 action 时，弹窗用途必须是 add/edit，否则直接失败返回
    if (!action && !['edit', 'add'].includes(modalAction.value)) {
      return false
    }
    await validation()
    const actions: Record<'add' | 'edit', SaveAction> = {
      add: {
        api: () => doCreate(modalForm.value),
        cb: () => $message.success('新增成功'),
      },
      edit: {
        api: () => doUpdate(modalForm.value),
        cb: () => $message.success('保存成功'),
      },
    }

    // 走到这里 action 必有值：要么调用方传入，要么上面守卫保证 modalAction 是 add/edit
    action = action || actions[modalAction.value as 'add' | 'edit']

    try {
      okLoading.value = true
      const data = await action.api()
      action.cb()
      okLoading.value = false
      data && refresh(data)
    }
    catch (error) {
      console.error(error)
      okLoading.value = false
      return false
    }
  }

  /** 删除 */
  function handleDelete(id: number | string | undefined, confirmOptions?: Partial<DialogOptions>) {
    if (!id && id !== 0)
      return
    const d = $dialog.warning({
      content: '确定删除？',
      title: '提示',
      positiveText: '确定',
      negativeText: '取消',
      async onPositiveClick() {
        try {
          d.loading = true
          const data = await doDelete(id)
          $message.success('删除成功')
          d.loading = false
          refresh(data, true)
        }
        catch (error) {
          console.error(error)
          d.loading = false
        }
      },
      ...confirmOptions,
    })
  }

  return {
    modalRef,
    modalFormRef,
    modalAction,
    modalForm,
    okLoading,
    validation,
    handleAdd,
    handleDelete,
    handleEdit,
    handleView,
    handleOpen,
    handleSave,
  }
}
