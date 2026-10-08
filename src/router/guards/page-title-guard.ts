import type { Router } from 'vue-router'

const baseTitle = import.meta.env.VITE_TITLE

/** 跳转成功后把 meta.title 拼上站点名写入浏览器标签标题，无 title 则回退站点名 */
export function createPageTitleGuard(router: Router): void {
  router.afterEach((to) => {
    const pageTitle = to.meta?.title
    if (pageTitle) {
      document.title = `${pageTitle} | ${baseTitle}`
    }
    else {
      document.title = baseTitle
    }
  })
}
