import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
// 路由本质就是做到url切换的时候做到全局组件不变只更新个别的组件这个动作就是路由
// 路由守卫就是路由在切换的时候做到那些是要切换那些不可以的设置
// 从vue-router（pnpm下载的插件）导入创建路由（cteate就是英文创建）函数  import英文就是导入的意思
// Hash历史模式、History历史模式的函数 核心作用就是决定“网址切换的时候长什么样
// hash历史模式标志就是#   History历史模式不带#
// 函数a作为参数给到函数b 那么函数a其实就是回调函数
// 特定环节执行的函数就是钩子函数 特定的节点是框架自带的 开发者只能通过这个节点编辑逻辑
// import {}是静态导入一运行就会导入  import（）是动态导入 只有执行到这行代码才会导入
// 静态导入中import Home from './Home.vue' 默认导入 是由导出文件决定的里面的export default a 就决定a函数是默认导入
// () => {}箭头函数的基本格式
import { basicRoutes } from './basic-routes'
// 导入基础路由配置（静态路由，无需权限即可访问的路由）  .为当前目录这里就是router
// import本质是把对应文件中的basicRoutes（变量、常量、函数、类、对象等）导入到本文件一个basicRoutes的变量
import { setupRouterGuards } from './guards' // 导入路由守卫设置函数（用于配置路由拦截逻辑）

// 导出路由实例，通过createRouter创建Vue Router实例
// export英文就是导出只有加上这个关键词 其他文件才可以import导入
// 下面本质就是给createRouter函数传参数再赋值
// 把函数的若干个参数整合到{}里变成一个对象
export const router = createRouter({
  // createRouter这个函数就是创建路由  router变量接收了就是对象实例了
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
  app.use(router) // 在Vue应用实例中注册这个实例路由器  use 方法，专门用来注册插件
  setupRouterGuards(router) // 调用路由守卫设置函数，配置路由守卫 自定义函数
}
/*
路由知识点
全局路由器（router实例）
  定义：通过useRouter()从vue-router获取的唯一单例实例
  是Vue Router的核心控制器，负责管理路由表、动态路由及导航逻辑。
1. 导航控制方法
router.push(location, onComplete?, onAbort?)
  作用：跳转到指定路径，添加历史记录（可回退）。
  location：目标路径（字符串或路由对象，如'/user'或{ path: '/user', query: { id: 1 } }）。
  onComplete：导航成功后的回调。onAbort：导航被取消后的回调。
  示例：router.push('/dashboard')
2. 路由表管理方法
router.addRoute(parentName, route)
  作用：动态添加路由（常用于权限路由）。
  parentName：父路由名称（可选，若为根路由则省略）。
  route：路由配置对象（如{ path: '/admin', component: Admin }）。
  示例：router.addRoute('layout', { path: '/admin', component: Admin })
router.removeRoute(name)
  作用：删除指定名称的路由（常用于用户登出时清理权限路由）。
  参数：name（路由名称）。
  示例：router.removeRoute('admin')
router.hasRoute(name)
  作用：检查路由是否存在（返回布尔值）。
  参数：name（路由名称）。
  示例：const exists = router.hasRoute('user')
router.getRoutes()
  作用：获取所有路由记录（返回路由配置数组）。
  示例：const routes = router.getRoutes()

路由守卫（guard）
  定义：Vue Router提供的钩子函数，用于在路由跳转过程中拦截逻辑，实现权限校验、加载状态控制等。

1. 全局守卫
router.beforeEach((to, from, next) => { ... })
触发时机：每次导航前调用（全局前置守卫）。
参数：
to：目标路由对象（route实例）。
from：当前路由对象（route实例）。
next：必须调用的函数，决定导航是否继续（next()允许，next(false)取消，next('/login')重定向）。

router.beforeResolve((to, from, next) => { ... })
触发时机：导航被确认前（所有组件内守卫和异步路由组件解析后调用）。
参数：同beforeEach。
用途：确保所有异步逻辑完成后再导航（如权限校验、数据预加载）。

router.afterEach((to, from) => { ... })
  触发时机：导航完成后调用（全局后置守卫）。
  参数：to（目标路由）、from（当前路由）。
  用途：记录导航日志、修改页面标题等。
*/
/*
当前路由对象（route对象）
定义：通过useRoute()获取的只读状态快照，记录当前激活路由的信息，页面切换时自动更新。
1. 核心属性
route.path
作用：当前路径（不包含查询参数和hash）。
示例：/user/profile
route.fullPath
作用：包含查询参数和hash的完整路径。
示例：/user/profile?id=1#section1
route.name
作用：路由名称（若有配置）。
示例：'user-profile'
route.params
作用：路由参数（如/:id中的id）。
示例：{ id: 1 }
route.query
作用：查询参数（如?name=xxx）。
示例：{ name: 'Alice' }
route.hash
作用：URL的hash部分（如#section1）。
示例：#section1
route.matched
作用：匹配到的路由记录数组（从父路由到子路由）。
示例：[ { path: '/layout', component: Layout }, { path: '/user', component: User } ]
route.meta
作用：路由元信息（如标题、权限标识）。
示例：{ title: '用户管理', requiresAuth: true }
route.redirectedFrom
作用：重定向来源的路由（若有重定向）。
示例：/login（若从/dashboard重定向到/login）
*/
