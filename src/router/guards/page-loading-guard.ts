// 导入页面加载状态守卫的创建函数
import type { Router } from 'vue-router'

export function createPageLoadingGuard(router: Router): void {
  router.beforeEach(() => { // 注册全局前置守卫：beforeEach插件自带钩子函数在路由跳转即将开始时触发
  // 全局前置守卫beforeEach 作用：在任何路由跳转发生之前，都会触发这个函数
    $loadingBar.start() // 调用全局加载进度条对象 $loadingBar 的 start 方法，开始显示加载动画
    // loadingBar是全局对象作用于window 的一个属性 不用导入
  }) // 结束 beforeEach 回调函数

  router.afterEach(() => { // 注册全局后置钩子：在路由跳转成功完成后触发
    setTimeout(() => {
      // 设置一个延时器，延迟执行结束逻辑，避免加载条闪烁过快
      $loadingBar.finish() // 调用全局加载进度条对象 $loadingBar 的 finish 方法，结束加载动画
    }, 200) // 设置延时时间为 200 毫秒
  })
  // 多层箭头回调函数 还是从最外面开始执行

  router.onError(() => { // 注册路由错误处理回调：在路由跳转过程中发生错误时触发
    $loadingBar.error() // 调用全局加载进度条对象 $loadingBar 的 error 方法，显示加载错误状态
  }) // 结束 onError 回调函数
} // 结束 createPageLoadingGuard 函数定义

/*
代码执行步骤顺序：
1. 定义并导出 createPageLoadingGuard 函数，用于注入路由守卫。
2. 调用 router.beforeEach 注册前置守卫：每次路由跳转开始时，立即启动顶部加载进度条。
3. 调用 router.afterEach 注册后置钩子：每次路由跳转成功后，延迟 200ms 结束进度条（优化视觉体验）。
4. 调用 router.onError 注册错误监听：路由跳转失败（如组件加载失败）时，将进度条置为错误状态。
*/
