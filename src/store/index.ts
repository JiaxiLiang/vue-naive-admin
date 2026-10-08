import type { App } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

/**
 * 初始化 Pinia：创建根实例、挂持久化插件后装入应用
 * @param app Vue 应用实例
 */
export function setupStore(app: App): void {
  const pinia = createPinia()
  // 持久化插件把主题、token、页签等状态同步到浏览器存储，刷新后可恢复
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
}

// 聚合导出各业务仓库，外部统一从 '@/store' 引入，无需关心模块拆分细节
export * from './modules'
