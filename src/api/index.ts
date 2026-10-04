// 整个项目真真是是去后端取数据的就是这个Axios插件
// 这个文件只是发送请求依旧是插件才是真正实施去取数据的
import type { LoginToken, PageParams, PageResult, PermissionItem, RawUserInfo } from '@/types/models'
import { request } from '@/utils'

/**
 * CRUD 接口工厂：把"新增/列表/更新/删除"四个标准端点的样板收敛为一处（DRY 收口）。
 * @param resource 端点前缀，如 '/user'（create=resource，update/delete=resource/:id）
 * @param readPath 列表查询路径，默认与 resource 相同（如 role 的分页接口是 /role/page）
 * 模板参数 T 为实体类型；Q 为列表查询参数类型（各资源按后端契约在 models.ts 收窄），
 * Q 经 MeCrud 的 :get-data 反向推断到页面的 queryItems，使查询字段名拼写错误在编译期报错
 */
export function createCrudApi<T extends { id: number }, Q extends PageParams & Record<string, unknown> = PageParams & Record<string, unknown>>(resource: string, readPath = resource) {
  return {
    create: (data: Partial<T>) => request.post(resource, data),
    read: (params: Q) => request.get<PageResult<T> | T[]>(readPath, { params }),
    update: (data: Partial<T> & { id: number }) => request.patch(`${resource}/${data.id}`, data),
    delete: (id: number) => request.delete(`${resource}/${id}`),
  }
}

export default {
  // 获取用户信息（后端原始形状含嵌套 profile，由 store/helper.ts 重组为前端 UserInfo）
  getUser: () => request.get<RawUserInfo>('/user/detail'),
  // 刷新token（A1 无感刷新：经 setupHttpAuth 注入 http 层调用；skipAuthRefresh 防自身 401 再触发刷新死循环）
  refreshToken: () => request.get<LoginToken>('/auth/refresh/token', { skipAuthRefresh: true }),
  // 登出
  logout: () => request.post('/auth/logout', {}, { needTip: false }),
  // 切换当前角色（后端返回切换后账号的新 token 载荷）
  switchCurrentRole: (role: number | string) => request.post<LoginToken>(`/auth/current-role/switch/${role}`),
  // 获取角色权限
  getRolePermissions: () => request.get<PermissionItem[]>('/role/permissions/tree'),
  // 验证菜单路径
  validateMenuPath: (path: string) => request.get<boolean>(`/permission/menu/validate?path=${path}`),
}
/*
调用栈、任务队列与事件循环知识点 (进阶版 - 宏任务与微任务)
┌──────────────────────────────────────────────────────────────────────┐
│                    JavaScript 运行时环境                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐                                               │
│   │   调用栈         │  ← 同步代码执行区 (JS 主线程)                 │
│   │  (执行栈)       │    先进后出 (LIFO)                             │
│   │                 │                                               │
│   │  ┌───────────┐  │                                               │
│   │  │  main()   │  │                                               │
│   │  └───────────┘  │                                               │
│   │  ┌───────────┐  │                                               │
│   │  │ funcA()   │  │                                               │
│   │  └───────────┘  │                                               │
│   └─────────────────┘                                               │
│           ▲                                                          │
│           │ (栈空了？)                                               │
│           │                                                          │
│   ┌───────┴───────────────────────────────────────────────┐          │
│   │          事件循环                     │          │
│   │   (Event Loop - 永远循环的监视器)                       │          │
│   │                                                         │          │
│   │  循环流程:                                              │          │
│   │  1. 执行一个宏任务                    │          │
│   │  2. 栈空后，【立即】清空所有微任务队列  │          │
│   │  3. 浏览器渲染更新 (UI Render) ← Vue更新DOM在这之前!  │          │
│   │  4. 下一轮循环，取下一个宏任务                          │          │
│   └─────────────────────────────────────────────────────────┘          │
│           ▲                    ▲                    ▲                  │
│           │                    │                    │                  │
│   ┌───────┴──────┐     ┌───────┴──────┐     ┌───────┴──────┐          │
│   │ 宏任务队列    │     │ 微任务队列    │     │  Web API     │          │
│   │ (MacroTask)  │     │ (MicroTask)  │     │ (浏览器后台) │          │
│   │              │     │              │     │              │          │
│   │ 优先级: 低    │     │ 优先级: 高    │     │ 多线程处理   │          │
│   │ 每次只执行一个│     │ 全部清空      │     │ 异步触发     │          │
│   │              │     │              │     │              │          │
│   │ ┌──────────┐ │     │ ┌──────────┐ │     │ ┌──────────┐ │          │
│   │ │setTimeout │ │     │ │Promise   │ │     │ │ DOM事件  │ │          │
│   │ │setInterval│ │     │ │ .then()  │ │     │ │ 点击等   │ │          │
│   │ │setImmediate│ │     │ │nextTick()│ │     │ │ 网络请求 │ │          │
│   │ │I/O 操作   │ │     │ │MutationObs│ │     │ │ 定时器   │ │          │
│   │ │UI 渲染    │ │     │ └──────────┘ │     │ └──────────┘ │          │
│   │ └──────────┘ │     │              │     │      ↓       │          │
│   │              │     │              │     │ 完成后推入队列│          │
│   │    ...       │     │    ...       │     └──────────────┘          │
│   └──────────────┘     └──────────────┘                               │
                                                                   │
│   ⏱️ 执行顺序口诀:                                                     │
│   同步代码 -> 所有微任务 -> 浏览器渲染 -> 下一个宏任务                   │
│   宏任务 = 大的主线程代码块 + 异步函数的await之前  微任务：await之后                                                              │
└──────────────────────────────────────────────────────────────────────┘
*******宏任务中修改dom数据或者状态都会生成微任务执行完同步就会dom更新
// 代码演示执行顺序
console.log('1. 同步代码开始'); // 【同步】主线程

setTimeout(() => {
  // 【宏任务】第二轮循环执行
  console.log('2. setTimeout 宏任务');
}, 0);

Promise.resolve().then(() => {
  // 【微任务】第一轮循环同步代码后立即执行
  console.log('3. Promise 微任务');
});

console.log('4. 同步代码结束'); // 【同步】主线程

// -------------------- 执行时间线 --------------------
// 1. 调用栈执行: '1. 同步代码开始'
// 2. 调用栈执行: '4. 同步代码结束'
//    (调用栈清空，Event Loop 开始工作)
// 3. 检查微任务队列: 发现 Promise.then -> 执行 '3. Promise 微任务'
//    (微任务队列清空)
// 4. 浏览器渲染更新 (UI Render) - 此时页面可能重绘
// 5. 检查宏任务队列: 发现 setTimeout -> 执行 '2. setTimeout 宏任务'

// 输出结果: 1 -> 4 -> 3 -> 2

// 🌟 Vue 的 nextTick 原理:
// Vue 修改数据后，将 DOM 更新逻辑放入【微任务队列】。
// 这意味着 DOM 更新会在同步代码结束后、浏览器渲染前、宏任务前执行。
// 速度极快，且避免了多次渲染。
*/
