// 页面标题守卫
import type { Router } from 'vue-router'

const baseTitle = import.meta.env.VITE_TITLE // 定义常量 baseTitle，从 Vite 环境变量中读取应用的全局基础标题

export function createPageTitleGuard(router: Router): void { // 导出函数 createPageTitleGuard，接收 router 实例作为参数，用于设置页面标题守卫
  router.afterEach((to) => {
    // afterEach钩子函数 他的参数就是整个箭头函数
    // afterEach就是一个触发节点 不同的函数只要使用了这个节点就会触发 加载条或者是这里的标题等都是
    // 注册全局后置钩子，在路由跳转成功完成后触发，参数 to 为目标路由对象
    const pageTitle = to.meta?.title
    // 是Vue Router 调用这个箭头函数 插件先是到配置表里面获取对应页面的信息 生成一个to对象复制信息代入箭头函数
    // 这里的参数是不是to都可以 本质就是代入为了获取meta属性才这么写的
    // 对象?.属性 当你不确定一个对象或者它的属性是否存在时，用它来防止报错。
    if (pageTitle) { // 判断目标路由是否存在自定义页面标题
      document.title = `${pageTitle} | ${baseTitle}`
      // 若存在自定义标题，则将其与基础标题拼接，赋值给浏览器标签页标题
      // document就是那个dom 整个页面
      // `${}`模板字符串语法，允许在字符串中嵌入变量和表达式
    }
    else { // 若不存在自定义标题
      document.title = baseTitle // 直接将基础标题赋值给浏览器标签页标题
    }
  })
}

/*
代码执行步骤顺序：
1. 读取环境变量：在模块加载时，从 import.meta.env 中获取 VITE_TITLE 并赋值给 baseTitle 常量。
2. 定义守卫函数：导出 createPageTitleGuard 函数，用于向路由实例注入标题修改逻辑。
3. 注册后置钩子：在函数内部调用 router.afterEach 注册全局后置守卫，确保每次路由跳转成功后执行逻辑。
4. 获取目标标题：在守卫回调中，从目标路由对象 to.meta 中提取 title 属性。
5. 条件判断与赋值：判断 pageTitle 是否存在，若存在则拼接“页面标题 | 基础标题”，若不存在则仅使用基础标题，最终更新 document.title。
*/
