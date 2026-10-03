# 阶段 4：composables 泛型化

迁移顺序（被依赖者先行）：`useModal` → `useForm` → `useCrud` → `useAliveData` → `index.js` 桶文件。

## 4.0 前置：共享的"组件暴露类型"放 src/types/me-components.ts

`useModal` 需要描述 MeModal 组件 `defineExpose` 出来的东西，而 MeModal 本体阶段 6 才迁移。把暴露接口定义在独立类型文件，两边引用，避免循环依赖：

```ts
/** MeModal.open() 的入参（对应组件 props + 运行时合并的 options） */
export interface ModalOptions {
  width?: string
  title?: string
  closable?: boolean
  cancelText?: string
  okText?: string
  showFooter?: boolean
  showCancel?: boolean
  showOk?: boolean
  modalStyle?: Record<string, any>
  contentStyle?: Record<string, any>
  /** 返回 false 可阻止弹窗关闭 */
  onOk?: (data?: any) => Promise<unknown> | unknown
  onCancel?: (data?: any) => Promise<unknown> | unknown
  /** 运行时内部字段（open 时由 modal 管理） */
  okLoading?: boolean
}

/** MeModal defineExpose 的形状（阶段 6 组件迁移时必须满足它） */
export interface MeModalExposed {
  open: (options?: Partial<ModalOptions>) => Promise<void>
  close: () => void
  handleOk: (data?: any) => Promise<void>
  handleCancel: (data?: any) => Promise<void>
  okLoading: boolean
  options: ModalOptions
}
```

## 4.1 useModal.js → useModal.ts

```ts
import type { Ref, WritableComputedRef } from 'vue'
import type { MeModalExposed } from '@/types/me-components'

/** 返回 [modalRef, okLoading]，modalRef 挂到 <MeModal ref> 上 */
export function useModal(): [Ref<MeModalExposed | null>, WritableComputedRef<boolean>] {
  const modalRef = ref<MeModalExposed | null>(null)
  const okLoading = computed({
    get() {
      return modalRef.value?.okLoading ?? false   // 原实现返回 undefined，?? false 保持布尔语义
    },
    set(v) {
      // 原实现 modalRef.value.okLoading = v 在弹窗未挂载时会抛 TypeError
      // 保持等价行为用非空断言，不要改成 ?. （会把抛错变成静默 no-op）
      modalRef.value!.okLoading = v
    },
  })
  return [modalRef, okLoading]
}
```

> 原实现 getter 无 `?? false`。若加它属于行为微调（undefined → false），二选一：要么原样返回 `boolean | undefined` 把签名写成 `WritableComputedRef<boolean | undefined>`，要么加 `?? false`。**推荐后者**并在 commit message 注明这一处语义补全；setter 的 `!` 断言同理要在进度文档记录。

## 4.2 useForm.js → useForm.ts

```ts
import type { FormInst, FormItemRule } from 'naive-ui'
import type { Ref } from 'vue'
import { cloneDeep } from 'lodash-es'

/**
 * 表单管家
 * @returns [formRef(挂到 n-form), formModel(响应式表单数据), validation(触发表单校验), rules(通用校验规则)]
 */
export function useForm<T extends object = Record<string, any>>(initFormData: T = {} as T):
[Ref<FormInst | null>, Ref<T>, () => Promise<void>, { required: FormItemRule }] {
  const formRef = ref<FormInst | null>(null)
  const formModel = ref<T>(cloneDeep(initFormData))
  const rules = {
    required: {
      required: true,
      message: '此为必填项',
      trigger: ['blur', 'change'],
    },
  } satisfies { required: FormItemRule }
  const validation = () => {
    return formRef.value?.validate()
  }
  return [formRef, formModel, validation, rules]
}
```

注意：`rules` 被 spread 进各页面的 `:rule` 用法，`satisfies` 保留字面量精确类型。naive-ui 的类型必须**显式 import type**（auto-import 不覆盖类型）。

## 4.3 useCrud.js → useCrud.ts（本阶段核心）

```ts
import type { Ref } from 'vue'
import type { ApiResult } from '@/utils/http'
import type { MeModalExposed, ModalOptions } from '@/types/me-components'
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
  const { name, initForm = {}, doCreate, doDelete, doUpdate, refresh } = options

  const modalAction = ref<ModalAction>('')
  const [modalRef, okLoading] = useModal()
  const [modalFormRef, modalForm, validation] = useForm<Partial<T>>(initForm as Partial<T>)

  // handleAdd/handleEdit/handleView/handleOpen/handleSave/handleDelete 实现体原样保留，
  // 只补参数类型：
  //   handleAdd(row: Partial<T> = {}, title?: string)
  //   handleEdit(row: Partial<T>, title?: string)
  //   handleView(row: Partial<T>, title?: string)
  //   handleOpen(options: ModalOptions & { action?: ModalAction, row?: Partial<T> } = {})
  //   handleSave(action?: SaveAction): Promise<boolean | undefined>  —— 返回值：校验失败/成功时 undefined，
  //     catch 分支 false，!action 且 action 非法时 false，以原实现运行时行为为准加注释说明
  //   handleDelete(id: number | string | undefined, confirmOptions?: Partial<DialogOptions>)
  //     —— 原实现 if (!id && id !== 0) return，签名必须允许 undefined
}
```

关键点：
- `ModalAction` 的 `string & {}` 技巧：保留内置三种的字面量提示，同时允许业务扩展任意字符串。
- `handleSave` 内 `actions` 常量表类型：`Record<'add' | 'edit', SaveAction>`。
- `modalForm.value = { ...row }`（handleOpen 内）：`Partial<T>` 展开，类型成立。
- 返回对象不写显式类型，让 TS 推导（调用页解构时获得精确类型）。

## 4.4 useAliveData.js → useAliveData.ts

```ts
import type { Ref } from 'vue'
import type { RouteRecordName } from 'vue-router'

const lastDataMap = new Map<RouteRecordName | string, object>()

export function useAliveData<T extends object>(initData: T, key?: RouteRecordName): {
  aliveData: Ref<T>
  reset: () => void
} {
  // 原实现 key = key ?? useRoute().name；RouteRecordName 可能为 null → String(key) 归一化
  //（行为差异：null key 原本会以 null 做 Map 键，归一化后是 'null' 字符串键。可接受，记录在进度文档）
}
```

## 4.5 composables/index.js → index.ts

桶文件加后缀即可，`export * from './useCrud'` 等不变（导出的接口类型会随 re-export 自动可用）。

## 验收

- `pnpm typecheck` 通过
- 手测：用户页弹窗全流程——新增（表单校验不通过时不关闭）、编辑、查看（表单禁用）、重置密码、分配角色、删除确认。这些路径覆盖了 useCrud 的全部分支
- 自检：在 user 页临时写 `const { modalForm } = useCrud({...})`，`modalForm.value.username` 应有补全（验证泛型链路），验证后删除
