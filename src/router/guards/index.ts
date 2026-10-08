import type { Router } from 'vue-router'
import { createPageLoadingGuard } from './page-loading-guard'
import { createPageTitleGuard } from './page-title-guard'
import { createPermissionGuard } from './permission-guard'
import { createTabGuard } from './tab-guard'

/**
 * 统一注册全局守卫；注册顺序即执行顺序：
 * loading 开条 → permission 校验放行 → title / tab 在跳转成功后收尾
 */
export function setupRouterGuards(router: Router): void {
  createPageLoadingGuard(router)
  createPermissionGuard(router)
  createPageTitleGuard(router)
  createTabGuard(router)
}
