/** 浏览器原生 Storage 类型（起别名，避免被下方同名类遮蔽） */
type StorageLike = globalThis.Storage

/** set 写入的信封结构：value 为业务数据，time 为写入时间戳，expire 为绝对过期时间戳（null 表示永不过期） */
interface StoredEnvelope<T> {
  value: T
  time: number
  expire: number | null
}

interface StorageOptions {
  /** 底层存储引擎（localStorage / sessionStorage） */
  storage: StorageLike
  /** 键的命名空间前缀 */
  prefixKey: string
}

/**
 * 浏览器 Storage 统一封装，三条核心策略：
 * - 命名空间：真实键 = prefixKey + key（统一转小写）——浏览器仓库多项目共享，前缀隔离避免键冲突
 * - 序列化：值统一包进信封结构（业务值 + 写入时间 + 过期时间）后 JSON 落盘，读出时解析还原
 * - 过期：get 时比对绝对过期时间戳，已过期或 JSON 损坏的键读后即清除并返回默认值
 */
class Storage {
  private storage: StorageLike
  private prefixKey: string

  /** 持有底层引擎与命名空间前缀 */
  constructor(option: StorageOptions) {
    this.storage = option.storage
    this.prefixKey = option.prefixKey
  }

  /** 拼真实存储键：前缀 + key，统一转小写 */
  getKey(key: string): string {
    return `${this.prefixKey}${key}`.toLowerCase()
  }

  /** 写入：expire 以秒为单位（内部换算为绝对时间戳；不传即永不过期） */
  set(key: string, value: unknown, expire?: number): void {
    const envelope: StoredEnvelope<unknown> = {
      value,
      time: Date.now(),
      expire: expire !== undefined ? Date.now() + expire * 1000 : null,
    }
    this.storage.setItem(this.getKey(key), JSON.stringify(envelope))
  }

  /** 读取：未存储 / 已过期 / JSON 损坏三种情况统一返回默认值（未传 def 则为 undefined） */
  get<T>(key: string): T | undefined
  get<T>(key: string, def: T): T
  get<T>(key: string, def?: T): T | undefined {
    const raw = this.storage.getItem(this.getKey(key))
    if (raw === null)
      return def
    try {
      // JSON.parse 返回任意 JSON 值，这里按写入时的信封结构收口；
      // 形状不符（如裸数字/裸字符串）时解构得 undefined，落入过期分支走默认值
      const { value, expire } = JSON.parse(raw) as StoredEnvelope<T>
      if (expire === null || expire > Date.now())
        return value
      this.remove(key)
      return def
    }
    catch (error) {
      // 损坏键读后即清除：留着只会在每次读取时反复报错
      console.error(error)
      this.remove(key)
      return def
    }
  }

  /** 按命名空间键移除单条 */
  remove(key: string): void {
    this.storage.removeItem(this.getKey(key))
  }

  /** 清空底层仓库（原生 clear，会连同其他前缀的键一并清掉，慎用） */
  clear(): void {
    this.storage.clear()
  }
}

/** 存储实例工厂：storage 缺省 sessionStorage，prefixKey 缺省空串 */
export function createStorage({ prefixKey = '', storage = sessionStorage }: Partial<StorageOptions>): Storage {
  return new Storage({ prefixKey, storage })
}
