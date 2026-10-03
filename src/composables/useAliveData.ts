import type { Ref } from 'vue'
// 保存和恢复组件数据 暂时没使用
import type { RouteRecordName } from 'vue-router'

const lastDataMap = new Map<string, object>()

export function useAliveData<T extends object>(initData: T = {} as T, key?: RouteRecordName): {
  aliveData: Ref<T>
  reset: () => void
} {
  // 原 key = key ?? useRoute().name；RouteRecordName 可能为 null → 用 String(key) 归一化做 Map 键
  // （行为差异：null key 原本以 null 做键，归一化后是 'null' 字符串键，见进度文档记录）
  key = key ?? useRoute().name
  const mapKey = String(key)
  const lastData = lastDataMap.get(mapKey)
  const aliveData = ref((lastData as T) || { ...initData }) as Ref<T>

  watch(
    aliveData,
    (v) => {
      lastDataMap.set(mapKey, v)
    },
    { deep: true },
  )

  return {
    aliveData,
    reset() {
      aliveData.value = { ...initData }
      lastDataMap.delete(mapKey)
    },
  }
}
