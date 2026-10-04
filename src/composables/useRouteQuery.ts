import type { Ref } from 'vue'
// 列表筛选状态与路由 query 的双向桥：URL 是筛选状态的持久层——刷新不丢、链接可分享、直开即筛选后视图。
// 痛点对照：queryItems 只活在内存，MeCrud 重置/搜索改的只是组件状态，F5 一刷新就归零
import type { LocationQueryRaw, LocationQueryValue } from 'vue-router'

/**
 * 把一个筛选状态对象双向同步到路由 query：
 * - 初始化：从 route.query 读参数（类型还原）合并进初始值，URL 是进入页面那一刻的事实源
 * - 同步：状态变化 → router.replace 更新 URL（replace 不污染历史记录，后退键回退的是页面而非筛选的中间态）
 * 页面侧一行接入：const queryItems = useRouteQuery({ username: undefined, enable: undefined })
 */
export function useRouteQuery<T extends Record<string, unknown>>(initial: T): Ref<T> {
  const route = useRoute()
  const router = useRouter()

  // 初始化只认 initial 里声明过的键：不吞无关参数（如登录回跳携带的 redirect）
  const state = ref({ ...initial }) as Ref<T>
  for (const key of Object.keys(initial) as Array<keyof T & string>) {
    const restored = parseQueryValue(route.query[key])
    if (restored !== undefined)
      state.value[key] = restored as T[keyof T & string]
  }

  // 只 watch 状态（deep）→ 写 URL 的单向流；不 watch route——
  // 守卫或其它页面改 query 时若再回写状态，会形成互相触发的死循环
  watch(state, (value) => {
    const query: Record<string, unknown> = { ...route.query } // 复制保留非自有键
    for (const key of Object.keys(initial) as Array<keyof T & string>) {
      const v = value[key]
      // undefined / null / 空串从 query 中删除该键（不留 'undefined' 或 'enable=' 的脏值）
      if (v === undefined || v === null || v === '') {
        delete query[key]
      }
      else {
        // URL query 全是字符串：写入统一 JSON 序列化，读取侧 parse 后 number/boolean/string 无损还原
        query[key] = JSON.stringify(v)
      }
    }
    router.replace({ query: query as LocationQueryRaw })
  }, { deep: true })

  return state
}

/** URL query 值还原：JSON.parse 失败兜底原始字符串——手输的脏参数不崩，按字面量当字符串用 */
function parseQueryValue(raw: LocationQueryValue | LocationQueryValue[] | undefined): unknown {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === null || value === undefined)
    return undefined
  try {
    return JSON.parse(value)
  }
  catch {
    return value
  }
}
