import type { CSSProperties } from 'vue'

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
  modalStyle?: CSSProperties
  contentStyle?: CSSProperties
  /** 返回 false 可阻止弹窗关闭 */
  onOk?: (data?: unknown) => Promise<unknown> | unknown
  onCancel?: (data?: unknown) => Promise<unknown> | unknown
  /** 运行时内部字段（open 时由 modal 管理） */
  okLoading?: boolean
}

/** MeModal defineExpose 的形状（MeModal 组件必须满足它） */
export interface MeModalExposed {
  open: (options?: Partial<ModalOptions>) => Promise<void>
  close: () => void
  handleOk: (data?: unknown) => Promise<void>
  handleCancel: (data?: unknown) => Promise<void>
  okLoading: boolean
  options: ModalOptions
}
