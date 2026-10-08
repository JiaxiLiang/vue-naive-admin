import type { CSSProperties } from 'vue'

/**
 * useModal 与 MeModal 共用的组件类型定义，独立成文件以避免二者循环依赖
 */

/** MeModal.open() 的入参（组件 props 与运行时 options 合并后的形状） */
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
  /** 运行时内部字段，由 modal 自身维护，调用方不传 */
  okLoading?: boolean
}

/** MeModal 组件 defineExpose 必须满足的形状 */
export interface MeModalExposed {
  open: (options?: Partial<ModalOptions>) => Promise<void>
  close: () => void
  handleOk: (data?: unknown) => Promise<void>
  handleCancel: (data?: unknown) => Promise<void>
  okLoading: boolean
  options: ModalOptions
}
