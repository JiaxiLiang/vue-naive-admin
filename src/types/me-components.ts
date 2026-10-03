/**
 * "组件暴露类型"共享定义（useModal 与 MeModal 组件两边引用，避免循环依赖）
 */

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
