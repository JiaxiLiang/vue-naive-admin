import type { Ref } from 'vue'
import type { LocationQueryRaw, LocationQueryValue } from 'vue-router'

/**
 * 列表筛选状态与路由 query 的双向桥：URL 即筛选状态的持久层——刷新不丢、链接可分享、
 * 直开即筛选后的视图，解决纯内存筛选态（queryItems）F5 即归零的问题。
 * 初始化时从 route.query 还原各字段（类型还原）合并进初始值；此后状态一变即改写地址栏。
 * 页面一行接入：const queryItems = useRouteQuery({ username: undefined, enable: undefined })
 */
export function useRouteQuery<T extends Record<string, unknown>>(initial: T): Ref<T> {
  const route = useRoute()
  const router = useRouter()

  // 还原只认 initial 里声明过的键：不吞无关参数（如登录回跳携带的 redirect）
  const state = ref({ ...initial }) as Ref<T>
  for (const key of Object.keys(initial) as Array<keyof T & string>) {
    const restored = parseQueryValue(route.query[key])
    if (restored !== undefined)
      state.value[key] = restored as T[keyof T & string]
  }

  // 只 watch 状态→写 URL 的单向流；不反向 watch route——守卫或其它页面改 query 时
  // 若再回写状态，会互相触发形成死循环
  watch(state, (value) => {
    const query: Record<string, unknown> = { ...route.query } // 复制保留非自有键
    for (const key of Object.keys(initial) as Array<keyof T & string>) {
      const v = value[key]
      // undefined / null / 空串直接从 query 删键，不留 'undefined'、'enable=' 之类的脏值
      if (v === undefined || v === null || v === '') {
        delete query[key]
      }
      else {
        // URL query 值只能是字符串：统一 JSON 序列化写入，读取侧 parse 后 number/boolean/string 无损还原
        query[key] = JSON.stringify(v)
      }
    }
    // 用原生 replaceState 就地改写地址栏、不发起路由导航：App.vue 的路由组件以 curRoute.fullPath
    // 为 key，router.replace 改 query 会触发整页重挂载（输入焦点丢失、按需请求重复发起）；
    // resolve().href 兼容 history/hash 两种模式的 URL 形状；history.state 原样透传
    // （vue-router 的位置指针存在这里，覆盖会破坏后退语义）
    const href = router.resolve({ path: route.path, hash: route.hash, query: query as LocationQueryRaw }).href
    window.history.replaceState(window.history.state ?? null, '', href)
  }, { deep: true })

  return state
}

/** URL query 值还原：JSON.parse 失败兜底为原始字符串——手输的脏参数不崩，按字面量当字符串用 */
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
