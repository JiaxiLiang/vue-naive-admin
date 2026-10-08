import type { Ref } from 'vue'

export interface UseRequestOptions {
  /** run 新请求时是否中止上一个（默认 true）：防止慢的旧响应回来覆盖新结果 */
  abortPrevious?: boolean
}

/**
 * 异步请求标准件：把页面散装的"发请求→写状态"收敛为自带 loading、错误记录、
 * 组件卸载自动取消与竞态防护的组合式函数。
 * 竞态防护是双保险：① 新 run 默认先中止上一个在途请求（AbortController）；
 * ② 每个 run 持有自增序号，响应回来时序号不是最新即整体丢弃——即便请求无法被中止
 * （如 mock 数据），慢的旧结果也写不进状态。
 * @param fetcher 实际发请求的函数，接收 AbortSignal（透传给 axios 的 config.signal，axios 原生能力）
 * @returns data/loading/error 三态 + run 触发 + cancel 手动中止。
 * error 只记录不弹窗：全局错误提示职责在 http 层（needTip 默认弹），这里再弹会一次失败两条提示
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
  // 本实例私有的请求序号：每次 run 自增；响应回来时序号对不上最新值，即视为已被更新的 run 取代
  let seq = 0
  let controller: AbortController | undefined

  const data = ref<T>() as Ref<T | undefined>
  const loading = ref(false)
  const error = ref<unknown>()

  /** 手动中止当前在途请求；即便响应已到达也不会再写入状态 */
  function cancel(): void {
    controller?.abort()
    controller = undefined
  }

  /** 发起一次请求；返回 undefined 表示本次已被更新的 run 取代或请求失败 */
  async function run(): Promise<T | undefined> {
    // 竞态防护第一层：默认中止上一个在途请求
    if (options?.abortPrevious !== false)
      cancel()

    // 竞态防护第二层：给本次 run 发号，只有最新号才有资格写状态
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
      // 被 cancel 中止（AbortError）或已过期的旧请求，同样不写状态
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

  // 作用域销毁（组件卸载）时自动中止在途请求，响应即便到达也写不进已卸载组件的状态；
  // failSilently：纯逻辑单测等无作用域环境下静默跳过（无作用域即无卸载时机，跳过即正确语义）
  onScopeDispose(cancel, true)

  return { data, loading, error, run, cancel }
}
