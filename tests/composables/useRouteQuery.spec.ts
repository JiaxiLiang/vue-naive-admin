import type { Ref } from 'vue'
import type { Router } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useRouteQuery } from '@/composables/useRouteQuery'

/** router.replace 与 watch 的 pre 回调都在微任务/渲染时序里，用宏任务兜底等齐 */
function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

interface Harness<T extends Record<string, unknown>> {
  state: Ref<T>
  router: Router
  unmount: () => void
}

/** 挂一个探针组件：真实经过 router 注入，URL 初始 query 由用例给定 */
async function mountWithQuery<T extends Record<string, unknown>>(query: Record<string, string>, initial: T): Promise<Harness<T>> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  })
  await router.push({ path: '/list', query })
  await router.isReady()

  let state!: Ref<T>
  const app = createApp({
    setup() {
      // 捕获组合式函数返回的 Ref 本体（不得经 ref() 二次包装，否则外层 .value 是 Ref 对象而非解包值）
      state = useRouteQuery(initial)
      return () => h('div')
    },
  })
  app.use(router)
  const container = document.createElement('div')
  app.mount(container)
  return {
    state,
    router,
    unmount: () => app.unmount(),
  }
}

function currentQuery(router: Router): Record<string, unknown> {
  return router.currentRoute.value.query
}

describe('useRouteQuery 筛选状态同步 URL', () => {
  it('初始化：从 URL 还原类型（enable=0 还原为数字 0，JSON 字符串还原为 string）', async () => {
    const { state, unmount } = await mountWithQuery(
      { enable: '0', username: '"foo"' },
      { username: undefined, enable: undefined },
    )

    expect(state.value.enable).toBe(0)
    expect(state.value.username).toBe('foo')
    unmount()
  })

  it('初始化：非法 JSON 兜底原始字符串，不崩', async () => {
    const { state, unmount } = await mountWithQuery(
      { username: 'abc' },
      { username: undefined },
    )

    expect(state.value.username).toBe('abc')
    unmount()
  })

  it('初始化：URL 缺参时保持初始值，不产出脏键', async () => {
    const { state, unmount } = await mountWithQuery(
      {},
      { username: undefined, enable: undefined },
    )

    expect(state.value).toEqual({ username: undefined, enable: undefined })
    unmount()
  })

  it('同步：状态变化写回 URL（JSON 序列化）', async () => {
    const { state, router, unmount } = await mountWithQuery(
      {},
      { username: undefined, enable: undefined },
    )

    state.value.username = 'bar'
    await nextTick()
    await flush()

    expect(currentQuery(router).username).toBe('"bar"')
    unmount()
  })

  it('同步：undefined / 空串从 URL 删除该键，不留脏值', async () => {
    const { state, router, unmount } = await mountWithQuery(
      { enable: '0' },
      { username: undefined, enable: undefined },
    )

    state.value.enable = undefined
    state.value.username = ''
    await nextTick()
    await flush()

    expect('enable' in currentQuery(router)).toBe(false)
    expect('username' in currentQuery(router)).toBe(false)
    unmount()
  })

  it('边界：非自有键（redirect）保留在 URL，也不进状态', async () => {
    const { state, router, unmount } = await mountWithQuery(
      { redirect: '/home', enable: '1' },
      { enable: undefined },
    )

    expect(state.value.enable).toBe(1)
    expect(state.value).not.toHaveProperty('redirect')

    state.value.enable = 0
    await nextTick()
    await flush()

    expect(currentQuery(router).redirect).toBe('/home')
    expect(currentQuery(router).enable).toBe('0')
    unmount()
  })

  it('边界：MeCrud 重置链路——整体替换状态对象同样触发 URL 同步', async () => {
    const { state, router, unmount } = await mountWithQuery(
      { username: '"foo"', enable: '0' },
      { username: undefined, enable: undefined },
    )

    // 模拟 MeCrud handleReset 的 emit('update:queryItems', 恢复初始值)
    state.value = { ...state.value, username: undefined, enable: undefined }
    await nextTick()
    await flush()

    expect('username' in currentQuery(router)).toBe(false)
    expect('enable' in currentQuery(router)).toBe(false)
    unmount()
  })
})
