import type { Ref, WritableComputedRef } from 'vue'
import type { MeModalExposed } from '@/types/me-components'

/**
 * 弹窗遥控器：modalRef 挂到 <MeModal ref> 上，页面侧即可 open/close 弹窗；
 * okLoading 是确认按钮 loading 的可写计算属性，读写直达弹窗内部状态
 */
export function useModal(): [Ref<MeModalExposed | null>, WritableComputedRef<boolean>] {
  const modalRef = ref<MeModalExposed | null>(null)
  const okLoading = computed({
    get() {
      // 弹窗未挂载时读到 undefined，?? false 补全为布尔消费语义
      return modalRef.value?.okLoading ?? false
    },
    set(v) {
      // 未挂载时用非空断言保持抛错行为；若改成 ?. 会把抛错变成静默 no-op，掩盖使用时序错误
      modalRef.value!.okLoading = v
    },
  })
  return [modalRef, okLoading]
}
