// 保存和恢复组件数据 暂时没使用
const lastDataMap = new Map()
export function useAliveData(initData = {}, key) {
  key = key ?? useRoute().name
  const lastData = lastDataMap.get(key)
  const aliveData = ref(lastData || { ...initData })

  watch(
    aliveData,
    (v) => {
      lastDataMap.set(key, v)
    },
    { deep: true },
  )

  return {
    aliveData,
    reset() {
      aliveData.value = { ...initData }
      lastDataMap.delete(key)
    },
  }
}
