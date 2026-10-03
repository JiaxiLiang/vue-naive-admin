/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 页面标题 */
  readonly VITE_TITLE: string
  /** 是否使用 Hash 路由：'true' | 'false'（.env 里都是字符串） */
  readonly VITE_USE_HASH: string
  /** 资源公共路径 */
  readonly VITE_PUBLIC_PATH: string
  /** axios 基础路径（走 proxy 或直连 mock） */
  readonly VITE_AXIOS_BASE_URL: string
  /** 开发代理目标 */
  readonly VITE_PROXY_TARGET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
