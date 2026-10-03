import type { Ref, WritableComputedRef } from 'vue'
// 弹窗遥控器
import type { MeModalExposed } from '@/types/me-components'

/** 返回 [modalRef, okLoading]，modalRef 挂到 <MeModal ref> 上 */
export function useModal(): [Ref<MeModalExposed | null>, WritableComputedRef<boolean>] {
  const modalRef = ref<MeModalExposed | null>(null)
  const okLoading = computed({
    get() {
      // 原实现返回 undefined；?? false 属于语义补全（undefined → false），保持布尔消费语义
      return modalRef.value?.okLoading ?? false
    },
    set(v) {
      // 原实现 modalRef.value.okLoading = v 在弹窗未挂载时会抛 TypeError
      // 保持等价行为用非空断言，不要改成 ?.（会把抛错变成静默 no-op）
      modalRef.value!.okLoading = v
    },
  })
  return [modalRef, okLoading]
}
