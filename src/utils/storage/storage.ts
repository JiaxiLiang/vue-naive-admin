// 封装好的本地存储类
import { isNullOrUndef } from '@/utils' // 判断是unll还是undefined
// 设计理念：
// 1. STR：所调用的浏览器自带的仓库名。
// 2. PRE：前缀名。
// 3. KEY：每条数据的名字。
// 这三者组成的是“前缀名 + 名字”，以此作为一条数据的名字来分辨。
// 因为浏览器的仓库是多个项目共享的，只有这样子才能分辨是哪个项目的数据。

/** 浏览器原生 Storage（起别名，避免被下方同名类遮蔽） */
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

  constructor(option: StorageOptions) {
    this.storage = option.storage // 实例属性 storage：存底层存储引擎的引用
    this.prefixKey = option.prefixKey // 实例属性 prefixKey：存 key 前缀
  } // str和pre是声明的同时赋值

  // 每条数据取名字 前缀名+key
  getKey(key: string): string {
    return `${this.prefixKey}${key}`.toLowerCase() // tolo是转小写字符串自带
  }

  // 设置数据 参数（数据名字 数据内容 过期时间）
  set(key: string, value: unknown, expire?: number): void {
    const stringData = JSON.stringify({
      value,
      time: Date.now(),
      expire: !isNullOrUndef(expire) ? Date.now() + expire * 1000 : null,
    })
    this.storage.setItem(this.getKey(key), stringData)
  }

  // 获取数据
  get<T = unknown>(key: string): T | undefined {
    const { value } = this.getItem(key, {}) as { value: T | undefined }
    return value
  }

  getItem<T = unknown>(key: string, def: T = null as T): { value: T, time: number } | T {
    const val = this.storage.getItem(this.getKey(key))
    if (!val)
      return def
    try {
      const data = JSON.parse(val)
      const { value, time, expire } = data
      if (isNullOrUndef(expire) || expire > Date.now()) {
        return { value, time }
      }
      this.remove(key)
      return def
    }
    catch (error) {
      console.error(error)
      this.remove(key)
      return def
    }
  }

  remove(key: string): void {
    this.storage.removeItem(this.getKey(key))
  }

  clear(): void {
    this.storage.clear()
  }
}
// 创建存储实例 sessionStorage在这里不是字符串，它是真实的浏览器仓库的引用，也就是里面存储的是地址。
export function createStorage({ prefixKey = '', storage = sessionStorage }: Partial<StorageOptions>): Storage {
  return new Storage({ prefixKey, storage })
}
