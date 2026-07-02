import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
// 路由本质就是做到url切换的时候做到全局组件不变只更新个别的组件这个动作就是路由
// 路由守卫就是路由在切换的时候做到那些是要切换那些不可以的设置
// 从vue-router（pnpm下载的插件）导入创建路由（cteate就是英文创建）函数  import英文就是导入的意思
// Hash历史模式、History历史模式的函数 核心作用就是决定“网址切换的时候长什么样
// hash历史模式标志就是#   History历史模式不带#
// 函数a作为参数给到函数b 那么函数a其实就是回调函数
// 特定环节执行的函数就是钩子函数
// import {}是静态导入一运行就会导入  import（）是动态导入 只有执行到这行代码才会导入
// 静态导入中import Home from './Home.vue' 默认导入 是由导出文件决定的里面的export default a 就决定a函数是默认导入
import { basicRoutes } from './basic-routes'
// 导入基础路由配置（静态路由，无需权限即可访问的路由）  .为当前目录这里就是router
// import本质是把对应文件中的basicRoutes（变量、常量、函数、类、对象等）导入到本文件一个basicRoutes的变量
import { setupRouterGuards } from './guards' // 导入路由守卫设置函数（用于配置路由拦截逻辑）

// 导出路由实例，通过createRouter创建Vue Router实例
// export英文就是导出只有加上这个关键词 其他文件才可以import导入
// 下面本质就是给createRouter函数传参数再赋值
// 把函数的若干个参数整合到{}里变成一个对象
export const router = createRouter({
  history: // 配置路由历史模式（决定URL的展示方式）
    import.meta.env.VITE_USE_HASH === 'true'
    // 根据环境变量判断是否启用Hash模式（如#开头的URL） .env文件里面都是字符串
    // import.meta：原生对象，用于存储当前模块的元数据
    // .env：这是 Vite 这个构建工具额外扩展的属性 vite启动就会把.env变量挂载import.meta.env 对象
    // 不同的环境 vite就会加载不一样的.env
    // development开发环境（开发者调试） production这就是生产环境（用户）
      ? createWebHashHistory(import.meta.env.VITE_PUBLIC_PATH || '/') // 加上|| /shi 防止.env文件没做配置
      // 若启用Hash模式，创建Hash历史模式实例，路径为PUBLIC_PATH或根路径
      : createWebHistory(import.meta.env.VITE_PUBLIC_PATH || '/'),
  // 否则创建History模式实例（如/开头的URL），路径同上
  routes: basicRoutes, // 使用导入的基础路由配置（静态路由数组）
  // routes存放路由列表的那个属性
  scrollBehavior: () => ({ left: 0, top: 0 }),
  // scrollBehavior 在路由切换的过程中，定义页面滚动条的最终坐标位置这里是都划顶部
  // scrollBehavior 是 Vue Router自带的配置选项
})

// 导出异步函数，用于在Vue应用中初始化路由设置路由
// async英文就是异步的意思  async声明异步函数 await就是暂停（必须在async里面用）
// 函数是个体 方法是属于某个对象的函数  必须通过对象调用
// vue实例是幕后操作组件来显示dom dom就是我们能看到的内容
// app.use就是把插件安装到vue实例中
// js中变量就是盒子 里面可以放函数、对象、数组、字符串、数字等
// setupRouterGuards在本文件就是一个存着对应文件set函数的地址的变量 因为是盒子所以这里变量做函数使用
export async function setupRouter(app) { // 只是形参 传入是字符串也可以没有方法use
  app.use(router) // 在Vue应用实例中注册路由（使应用能使用路由功能）use 方法，专门用来注册插件
  setupRouterGuards(router) // 调用路由守卫设置函数，配置路由守卫 自定义函数
}
/* 代码执行步骤顺序：

导入依赖：从vue-router导入路由创建函数，从本地模块导入基础路由配置和路由守卫设置函数。
创建路由实例：通过createRouter创建Vue Router实例，配置历史模式（根据环境变量选择Hash或History模式）、基础路由和滚动行为。
导出设置函数：定义异步函数setupRouter，用于在Vue应用中注册路由实例并配置路由守卫。
注册路由：在Vue应用实例中调用app.use(router)注册路由，使应用能处理路由跳转。
配置守卫：调用setupRouterGuards函数，为路由添加守卫逻辑（如权限拦截、页面加载状态控制等）。
*/
