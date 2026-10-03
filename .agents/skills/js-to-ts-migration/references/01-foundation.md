# 阶段 1 + 2：settings / utils 工具层 / http 层

依赖关系提醒：本阶段产出的 `ApiResult`、`WrappedMessage` 等类型是后续所有阶段的基石，签名必须严格按本文写。

## 阶段 1：settings 与纯工具函数

### src/settings.js → settings.ts

```ts
import type { GlobalThemeOverrides } from 'naive-ui'
import type { PermissionItem } from '@/types/models'   // 类型先写占位，阶段 3 落地

export const defaultLayout: LayoutMode = 'normal'      // LayoutMode 定义见下
export type LayoutMode = 'normal' | 'full' | 'empty' | 'simple'

export const defaultPrimaryColor = '#316C72'
export const layoutSettingVisible = true

export const naiveThemeOverrides: GlobalThemeOverrides = {
  common: { /* 原内容不动 */ },
}

export const basePermissions: PermissionItem[] = [ /* 原内容不动 */ ]
```

`LayoutMode` 定义在本文件并导出，阶段 7 的布局切换和 RouteMeta 会复用。

### src/utils/is.js → is.ts（核心：类型谓词）

每个函数补谓词签名，调用方才能获得收窄：

```ts
const toString = Object.prototype.toString

export function is(val: unknown, type: string): boolean {
  return toString.call(val) === `[object ${type}]`
}
export function isDef<T = unknown>(val: T | undefined): val is T
export function isUndef(val: unknown): val is undefined
export function isNull(val: unknown): val is null
export function isWhitespace(val: unknown): val is ''
export function isObject<T extends object = Record<string, unknown>>(val: unknown): val is T
export function isArray<T = unknown>(val: unknown): val is T[]   // 注意原实现 val && Array.isArray，保留行为
export function isString(val: unknown): val is string
export function isNumber(val: unknown): val is number
export function isBoolean(val: unknown): val is boolean
export function isDate(val: unknown): val is Date
export function isRegExp(val: unknown): val is RegExp
export function isFunction<T extends (...args: any[]) => any = (...args: any[]) => any>(val: unknown): val is T
export function isPromise<T = any>(val: unknown): val is Promise<T>
export function isElement(val: unknown): val is Element
export function isWindow(val: unknown): val is Window
export function isNullOrUndef(val: unknown): val is null | undefined
export function isNullOrWhitespace(val: unknown): val is null | undefined | ''
export function isEmpty(val: unknown): boolean
export function ifNull<T extends number | boolean | string>(val: T | null | undefined | '', def: T | '' = ''): T | ''
export function isUrl(path: string): boolean
export function isExternal(path: string): boolean
export const isServer: boolean
export const isClient: boolean
```

注意：`isPromise` 原实现里 `isFunction(val.then)`，`val` 收窄为 `Promise<T>` 后 `val.then` 是方法，参数不匹配 `(...args:any[])=>any` 会报错——务实处理：`isFunction(val?.then as any)` 或把 isFunction 泛型默认放宽。保持运行时行为不变，选哪种写法以能通过 typecheck 为准，并在进度文档记录。

### src/utils/common.js → common.ts

```ts
import type { ConfigType } from 'dayjs'

export function formatDateTime(time: ConfigType = undefined, format = 'YYYY-MM-DD HH:mm:ss'): string
export function formatDate(date: ConfigType = undefined, format = 'YYYY-MM-DD'): string

// 节流/防抖：保留 function 声明（有 this 透传），this 标注 unknown
export function throttle<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters<T>) => void
export function debounce<T extends (...args: any[]) => any>(method: T, wait: number, immediate?: boolean): (...args: Parameters<T>) => void
// 实现体内的 context = this 需要写 this: unknown（function 声明形参位）：
//   return function (this: unknown, ...argArr: Parameters<T>) { ... }

export function sleep(time: number): Promise<void>
export function useResize(el: HTMLElement, cb: (rect: DOMRectReadOnly) => void): ResizeObserver
```

### src/utils/storage/storage.js → storage.ts（两个易错点）

1. **类名遮蔽**：原类名 `Storage` 会遮蔽 DOM 的 `Storage` 类型，`option.storage: Storage` 会解析到类自身。先起别名：

```ts
type StorageLike = globalThis.Storage

interface StorageOptions {
  /** 底层存储引擎 */
  storage: StorageLike
  /** key 前缀 */
  prefixKey: string
}

class Storage {
  private storage: StorageLike
  private prefixKey: string

  constructor(option: StorageOptions) { /* 原实现不动 */ }

  private getKey(key: string): string { /* 原实现不动 */ }

  /** 过期时间单位：秒 */
  set(key: string, value: unknown, expire?: number): void { /* 原实现不动 */ }

  get<T = unknown>(key: string): T | undefined { /* 原实现不动 */ }

  /** 默认值参数与返回值联动 */
  getItem<T = unknown>(key: string, def: T = null as T): { value: T, time: number } | T { /* 原实现不动 */ }

  remove(key: string): void { /* 原实现不动 */ }
  clear(): void { /* 原实现不动 */ }
}

export function createStorage<T = unknown>({ prefixKey = '', storage = sessionStorage }: Partial<StorageOptions>): Storage
```

注意 `def = null` 的默认值：签名写成 `def: T = null as T` 保持"不传时返回 null"的运行时行为，调用侧给具体类型参数（如 `getItem<number>(key, 0)`）。

2. 原实现 `get()` 里 `this.getItem(key, {})` 传了 `{}` 做默认值但只解构 value——类型上允许，行为不变。

### src/utils/storage/index.js → index.ts

只加参数类型：`createLocalStorage(option: { prefixKey?: string } = {})`，`lStorage`/`sStorage` 导出不变（返回 `Storage` 类实例）。

## 阶段 2：http 层（整个项目类型体系的基石）

### src/utils/http/index.js → index.ts

**核心决策**：响应拦截器已把 axios 的 `AxiosResponse` 替换为后端响应体，所以不能继续用 axios 自带类型。定义自己的 `HttpClient` 接口：

```ts
import type { AxiosRequestConfig, AxiosInstance } from 'axios'
import axios from 'axios'
import { setupInterceptors } from './interceptors'

/** 后端统一响应体（拦截器 resResolve 成功时 resolve 的就是它） */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

/** 拦截器失败时 reject 出来的统一形状（resResolve/resReject 的 reject 参数） */
export interface RequestError {
  code: number
  message?: string
  error: unknown
}

/** 扩展 axios 配置：本项目的两个自定义字段 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 本次请求是否携带 token（默认 true） */
  needToken?: boolean
  /** 业务失败时是否弹全局错误提示（默认 true） */
  needTip?: boolean
}

/** 业务代码面向的请求接口（get/post/patch/delete 均返回后端响应体） */
export interface HttpClient {
  get<T = any>(url: string, config?: RequestConfig): Promise<ApiResult<T>>
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResult<T>>
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResult<T>>
  delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResult<T>>
}

export function createAxios(options: AxiosRequestConfig = {}): AxiosInstance {
  const defaultOptions: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_AXIOS_BASE_URL,
    timeout: 12000,
  }
  const service = axios.create({ ...defaultOptions, ...options })
  setupInterceptors(service)
  return service
}

export const request: HttpClient = createAxios() as unknown as HttpClient

export const mockRequest: HttpClient = createAxios({ baseURL: '/mock-api' }) as unknown as HttpClient
```

> 非标准响应（如文件流）时拦截器 resolve 的是原始数据，调用侧可用 `request.get<Blob>` 收到"假 ApiResult"——保持原行为，在 `HttpClient` 注释里说明这一逃生舱，不为此引入联合类型。

### src/utils/http/interceptors.js → interceptors.ts

```ts
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResult, RequestConfig, RequestError } from './index'
import { useAuthStore } from '@/store'

export function setupInterceptors(axiosInstance: AxiosInstance): void {
  const SUCCESS_CODES: number[] = [0, 200]
  // resResolve 返回 Promise<ApiResult | any>（非 JSON 时 resolve 原始数据，见 HttpClient 注释）
  function resResolve(response: AxiosResponse): Promise<ApiResult | any> { /* 原实现不动 */ }
  axiosInstance.interceptors.request.use(reqResolve, reqReject)
  axiosInstance.interceptors.response.use(resResolve, resReject)
}

function reqResolve(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  // 自定义字段不在 InternalAxiosRequestConfig 上，需要窄化：
  if ((config as RequestConfig).needToken === false) {
    return config
  }
  const { accessToken } = useAuthStore()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
}

async function resReject(error: AxiosError): Promise<RequestError> { /* 原实现不动，内部访问 config.needTip 同样用 (config as RequestConfig) */ }
```

### src/utils/http/helpers.js → helpers.ts

```ts
import type { WrappedDialog } from '@/types/global'

export function resolveResError(code: number, message?: string, needTip = true): string | false
// 401/11007/11008 分支返回 handleAuthExpired(...) 即 false，其余分支返回 message 字符串

// handleAuthExpired(content: string, needTip: boolean): false
// 内部 $dialog.confirm({...}) 的 confirm/cancel 回调即 WrappedDialog 的扩展字段
```

`resolveResError` 里 `message = '请求被拒绝'` 的重新赋值：参数声明为 `message?: string`，赋值前判空逻辑保持原样（TS 会要求 message 非空断言或重构成局部变量——**用局部变量 `let tip: string`**，行为等价且类型干净）。

### src/utils/naiveTools.js → naiveTools.ts

`setupMessage` 返回类型必须是 `global.d.ts` 里的 `WrappedMessage`（单一事实来源）：

```ts
class Message {
  static instance: Message | undefined
  private message: Record<string, MessageReactive>
  private removeTimer: Record<string, ReturnType<typeof setTimeout>>
  // showMessage(type: MessageRenderMessage 支持的五个字面量联合, content: string, option: MessageOptions = {})
  // 五个公开方法签名对齐 WrappedMessage
}

export function setupMessage(NMessage: MessageApi): WrappedMessage
export function setupDialog(NDialog: DialogApiInjection): WrappedDialog  // 给 NDialog.confirm 赋值处用 (NDialog as any).confirm = ... 或声明合并，以 typecheck 通过为准
export function setupNaiveDiscreteApi(): void  // window.$message = setupMessage(message) 现在能对上 global.d.ts
```

### src/utils/index.js → index.ts

桶文件，仅加后缀，无类型改动。

## 验收

- `pnpm typecheck` 通过
- 手测重点：登录（storage 写入）、请求报错时的全局 message 弹出（断网或输错密码）、`$message`/`$dialog` 全部调用点正常
- 此时 composables/components/views 还是 .js，import 本阶段的 .ts 文件应正常工作（allowJs 下 TS 对 JS 开放推断类型）
