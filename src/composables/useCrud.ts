import type { DialogOptions } from 'naive-ui'
import type { ModalOptions } from '@/types/me-components'
import type { ApiResult } from '@/utils/http'
import { cloneDeep } from 'lodash-es'
import { useForm, useModal } from '.'

/** ACTIONS 的键即内置弹窗动作；要新增内置动作，只需在此常量补键值 */
const ACTIONS: Partial<Record<ModalAction, string>> = {
  view: '查看',
  edit: '编辑',
  add: '新增',
}

/** useCrud 内置支持的弹窗动作 */
export type BuiltinModalAction = 'view' | 'edit' | 'add'
/** 弹窗用途标识。内置三种，业务页可传任意扩展值（如 'reset'、'setRole'，见 user 页） */
export type ModalAction = BuiltinModalAction | (string & {})

/** 判定动作是否要走保存链路：add/edit 有对应提交接口，view 只读不保存 */
function isAddOrEdit(action: ModalAction): action is 'add' | 'edit' {
  return action === 'add' || action === 'edit'
}

/** handleSave 的自定义动作：api 是要执行的请求，cb 是成功后的回调（user 页 onSave 的 reset/setRole 分支传此结构） */
export interface SaveAction {
  api: () => Promise<ApiResult<unknown>>
  cb: () => void
}

export interface UseCrudOptions<T extends object> {
  /** 弹窗标题后缀，如 name: '用户' → '新增用户' */
  name: string
  /** 新增弹窗的表单初始值 */
  initForm?: Partial<T>
  /** 新增接口 */
  doCreate: (data: Partial<T>) => Promise<ApiResult<unknown>>
  /** 删除接口（id 为后端主键，删除目标必存在，故参数必填） */
  doDelete: (id: number) => Promise<ApiResult<unknown>>
  /** 更新接口（编辑保存的表单必带 id：行数据来自后端实体） */
  doUpdate: (data: Partial<T> & { id: number }) => Promise<ApiResult<unknown>>
  /** 保存/删除成功后的列表刷新回调；第二参数含义见各页 refresh 实现（keepCurrentPage） */
  refresh: (data?: unknown, keepCurrentPage?: boolean) => void
}

/**
 * CRUD 页面交互总控：把 useModal（弹窗遥控）与 useForm（表单管家）组装成一套页面级动作，
 * 新增/编辑/查看/删除/保存的开弹窗、表单回填、校验、loading、提示、刷新全部收拢在此，
 * 业务页只需注入接口与刷新回调
 */
export function useCrud<T extends object>(options: UseCrudOptions<T>) {
  const { name, initForm, doCreate, doDelete, doUpdate, refresh } = options

  const modalAction = ref<ModalAction>('')
  const [modalRef, okLoading] = useModal()
  // 显式标注泛型 Partial<T>：解构默认值 {} 会让 TS 把 initForm 推断成空对象类型，modalForm 将丢失字段类型
  const [modalFormRef, modalForm, validation] = useForm<Partial<T>>(initForm ?? {})

  /** 新增：表单初始值 = initForm 与 row 各自深拷贝后合并（row 优先），支持带默认值打开新增弹窗 */
  function handleAdd(row: Partial<T> = {}, title?: string) {
    handleOpen({ action: 'add', title, row: Object.assign({}, cloneDeep(initForm), cloneDeep(row)) })
  }

  /** 编辑：携带后端行数据打开弹窗 */
  function handleEdit(row: Partial<T>, title?: string) {
    handleOpen({ action: 'edit', title, row })
  }

  /** 查看：只读打开弹窗 */
  function handleView(row: Partial<T>, title?: string) {
    handleOpen({ action: 'view', title, row })
  }

  /** 打开弹窗：写入当前动作与表单数据；未自定义 onOk 时，确定按钮统一走 handleSave 保存链路 */
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

  /** 内置 add/edit 两个动作的接口与成功提示映射 */
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

  /**
   * 保存当前弹窗表单（弹窗确定按钮的默认链路）。
   * 返回值语义：false = 保存失败或守卫拦截；true = 保存成功（调用方仅以 !== false 判断，返回值本身未被消费）
   */
  async function handleSave(action?: SaveAction): Promise<boolean | undefined> {
    const currentAction = modalAction.value
    // 未传自定义动作时，当前弹窗用途必须是 add/edit，否则直接失败返回
    if (!action) {
      if (!isAddOrEdit(currentAction))
        return false
      action = actions[currentAction] // 类型守卫收窄后索引安全
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

  /** 删除：弹确认框后调删除接口并刷新列表；id 缺省（且非 0）时静默返回，不弹确认框 */
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
