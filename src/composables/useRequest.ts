// 异步请求标准件：把页面散装的"发请求→写状态"收敛为自带 loading / 竞态防护 / 自动取消的组合式函数。
// 教学对照：api.getAllRoles().then(({ data }) => (roles.value = data)) 的裸奔写法有四个缺口——
// 无 loading、失败静默、组件卸载后响应照样写入、快速连发时慢的旧响应覆盖新结果
import type { Ref } from 'vue'

export interface UseRequestOptions {
  /** run 新请求时中止上一个（默认 true，防竞态：慢的旧响应回来不会覆盖新结果） */
  abortPrevious?: boolean
}

/**
 * @param fetcher 接收 AbortSignal，透传给 axios 的 config.signal（axios 原生能力，零新依赖）
 * @returns data/loading/error 三态 + run 触发 + cancel 手动中止
 * 分层约定：http 层的 needTip 默认已全局弹错（resolveResError），error ref 只记录不弹窗——
 * 错误提示的职责在 http 层，这里重复弹会让一次失败出现两条提示
 */
export function useRequest<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  options?: UseRequestOptions,
): {
  data: Ref<T | undefined>
  loading: Ref<boolean>
  error: Ref<unknown>
  run: () => Promise<T | undefined>
  cancel: () => void
} {
  // 请求序号（本实例私有）：每次 run 自增；响应回来时序号对不上说明已被更新的 run 取代
  let seq = 0
  let controller: AbortController | undefined

  const data = ref<T>() as Ref<T | undefined>
  const loading = ref(false)
  const error = ref<unknown>()

  function cancel(): void {
    controller?.abort()
    controller = undefined
  }

  async function run(): Promise<T | undefined> {
    if (options?.abortPrevious !== false)
      cancel()

    const id = ++seq
    controller = new AbortController()
    loading.value = true
    try {
      const result = await fetcher(controller.signal)
      // 过期响应：状态已由更新的 run 接管，整体丢弃（不写 data/error，也不碰新 run 的 loading）
      if (id !== seq)
        return undefined
      data.value = result
      error.value = undefined
      return result
    }
    catch (err) {
      // 旧 run 被 cancel 中止（AbortError）或响应已过期，同样不写状态
      if (id !== seq)
        return undefined
      error.value = err
      return undefined
    }
    finally {
      // 只有仍是最新 run 才有权复位 loading，防止旧请求的 finally 关掉新请求的加载态
      if (id === seq)
        loading.value = false
    }
  }

  // 组件卸载自动中止在途请求：响应即便到达也不会再写入已卸载组件的状态。
  // failSilently：纯逻辑测试等无作用域环境下静默跳过（无作用域即无卸载时机，跳过是正确语义）
  onScopeDispose(cancel, true)

  return { data, loading, error, run, cancel }
}
