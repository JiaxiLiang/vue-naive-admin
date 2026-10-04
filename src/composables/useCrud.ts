//  把useModal()  useForm()组合封装成useCrud()
// 把 CRUD 页面的全部交互动作（新增/编辑/查看/删除/保存/开弹窗）封装成一个函数
import type { DialogOptions } from 'naive-ui'
import type { ModalOptions } from '@/types/me-components'
import type { ApiResult } from '@/utils/http'
import { cloneDeep } from 'lodash-es'
import { useForm, useModal } from '.'

/** ACTIONS 常量的键即内置弹窗动作；新增内置动作只需在此常量加键值 */
const ACTIONS: Partial<Record<ModalAction, string>> = {
  view: '查看',
  edit: '编辑',
  add: '新增',
}

/** useCrud 内置支持的弹窗动作 */
export type BuiltinModalAction = 'view' | 'edit' | 'add'
/** 弹窗用途标识。内置三种，业务页可传任意扩展值（如 'reset'、'setRole'，见 user 页） */
export type ModalAction = BuiltinModalAction | (string & {})

function isAddOrEdit(action: ModalAction): action is 'add' | 'edit' {
  return action === 'add' || action === 'edit'
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
  /** id 为后端主键，删除目标必存在，故必填 */
  doDelete: (id: number) => Promise<ApiResult<unknown>>
  /** 编辑保存的表单必带 id（行数据来自后端实体，见 handleSave 内的收口注释） */
  doUpdate: (data: Partial<T> & { id: number }) => Promise<ApiResult<unknown>>
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

  const actions: Record<'add' | 'edit', SaveAction> = {
    add: {
      api: () => doCreate(modalForm.value),
      cb: () => $message.success('新增成功'),
    },
    edit: {
      // 编辑态表单由 handleEdit(row) 携带后端行数据进入，id 必有；该运行时事实编译器不可知，在此收口一次
      api: () => doUpdate(modalForm.value as Partial<T> & { id: number }),
      cb: () => $message.success('保存成功'),
    },
  }

  /** 保存。返回值语义：false = 保存失败或守卫拦截；true = 保存成功（调用方仅用 !== false 判断，返回值本身未被消费） */
  async function handleSave(action?: SaveAction): Promise<boolean | undefined> {
    const currentAction = modalAction.value
    // 无自定义 action 时，弹窗用途必须是 add/edit，否则直接失败返回
    if (!action) {
      if (!isAddOrEdit(currentAction))
        return false
      action = actions[currentAction] // isAddOrEdit 收窄后索引安全
    }

    await validation()
    try {
      okLoading.value = true
      const data = await action.api()
      action.cb()
      okLoading.value = false
      data && refresh(data)
      return true
    }
    catch (error) {
      console.error(error)
      okLoading.value = false
      return false
    }
  }

  /** 删除。id 缺省（且非 0）时静默返回，不弹确认框 */
  function handleDelete(id: number | undefined, confirmOptions?: Partial<DialogOptions>) {
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
