import type { Router } from 'vue-router'

/** 顶部加载条：跳转开始即启动，成功后延迟收起，导航出错置错误态 */
export function createPageLoadingGuard(router: Router): void {
  router.beforeEach(() => {
    $loadingBar.start()
  })

  router.afterEach(() => {
    // 延迟 200ms 收起，避免快速连续跳转时进度条闪烁
    setTimeout(() => {
      $loadingBar.finish()
    }, 200)
  })

  // 组件懒加载失败等导航错误时置错误态，避免进度条停在半途
  router.onError(() => {
    $loadingBar.error()
  })
}
