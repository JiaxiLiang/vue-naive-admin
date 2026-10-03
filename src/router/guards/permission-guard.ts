// 权限守卫：核心逻辑
// 权限a页面是否有权限转跳转到这个B页面  查票-过闸-补录（刷新之后重新拿回
// Hook英文就是钩子 生命周期钩子是所谓信号函数是框架自带的，框架跑到哪个环节了，就发个信号通知你一下
// 组合式函数一般use开头本质就是一个自定义函数
// defineStore：绘制蓝图在pinia上绘制仓库的设置蓝图是def的返回值
// pinia就是前端的一个小后端 非持久化刷新就会丢失 处理全局的共享数据（权限 全局色调这些 不处理单一组件数据
// pinia的仓库类别是类似后端的表的 只是后端是存储在内存永久的 pinia是存在浏览器内存刷新就没了所以才要验证是否存在数据
// useRouterStore()根据蓝图在内存创建这个过程叫“实例化” 以及会有仓库的操作权
// useAuthStore (认证仓库)只管登录没有 useUserStore (用户信息仓库)管注册登录用户信息 usePermissionStore (权限/路由仓库) 存路由配置表
// 现代vue应用 本质上在同一个容器（网页）里面通过路由调度组件更替做到页面切换的效果
// url改变浏览器只是在网址显示的地方做改变 网页其实不会切换 由路由改变组件 服务器主要提供数据
// 每次url改变 路由都会生成一个新的对象（to）to本质就是一个路由配置对象（就是配置表那种 没方法就是数据）
// 后端发送的就是纯数据 页面跳转url是组件发出 路由根据url找pinia的路由配置表配对 如果空就会调取后端纯数据
import type { RouteLocationRaw, Router, RouteRecordRaw } from 'vue-router'
import api from '@/api'
// 导入封装好的 API 请求模块，用于后端接口调用
// 导入获取用户信息和权限列表的辅助函数
// 默认导出 api只是我自定义的变量名
import { useAuthStore, usePermissionStore, useUserStore } from '@/store'
// @/store状态管理中心 它是整个应用的数据中心（使用 Pinia）。它只负责“存”和“取”数据。
// Pinia：是 Vue 的状态管理插件（Vuex 的下一代）。它负责管理整个应用的全局数据
// Pinia和vue routes一样是插件
import { getPermissions, getUserInfo } from '@/store/helper'
// 专门负责“要”数据。它负责和后端接口打交道，发起 HTTP 请求，拿到后端返回的数据。

const WHITE_LIST: string[] = ['/login', '/404']// 就是不需要权限也可以访问的页面
// 定义路由白名单常量，包含无需登录即可访问的路径
// 函数是开发者调用的参数是路由对象 里面的箭头函数（to）是 Vue Router 框架调用的
export function createPermissionGuard(router: Router): void { // 导出创建权限守卫的函数，接收 router 实例作为参数
  router.beforeEach(async (to) => {
    // 注册全局前置守卫，使用 async 使内部支持异步操作，to 为目标路由对象
    const authStore = useAuthStore() // 获取认证状态管理实例
    // 拿到那个名为 ‘auth’ 的仓库的操作权（没有这个仓库就是新建 有就直接赋值
    // useAuthStore函数就是操作这个auth仓库的操作全的函数
    const token = authStore.accessToken // 从 store 中获取用户的访问令牌
    // accessToken 是变量 自定义的 用来存储信息的（后端生成的jwt格式通行证）access访问的意思

    /** 没有token */ // 注释说明：处理未登录（无令牌）的情况
    if (!token) { // 判断令牌是否存在
      if (WHITE_LIST.includes(to.path))
      // 若无令牌，判断目标路径是否在白名单内 includes数组自带用来检查数组里有没有括号里传进去的那个东西
      // path是路由对象to的属性，表示目标路由的路径
      // 框架根据这个 URL 创建了一个 to 对象（里面包含 path, query 等）在访问配置表把信息合并
        return true // 在白名单内，直接放行，允许跳转
      return { path: 'login', query: { ...to.query, redirect: to.path } }
      // 不在白名单，拦截并重定向到登录页，同时将原本要去的路径作为 redirect 参数携带，以便登录后回跳
      // return {}是重定向格式 （这里的重定向依旧是返回到框架本身
      // query 来自于 浏览器地址栏里问号后面的内容（例如 ?id=1）。它是动态的 这里是配置格式
      // ...to.query中的 ...是展开运算符
    }
    // 有token的情况 // 注释说明：处理已登录（有令牌）的情况
    if (to.path === '/login') // 若已登录且目标路径是登录页
      return { path: '/' } // 拦截并重定向到首页  /就是首页
    if (WHITE_LIST.includes(to.path)) // 若已登录且目标路径在白名单内（如 404）
      return true
    // 这些return都是箭头函数里面的任意执行一个都是退出函数
    const userStore = useUserStore() // 获取用户信息仓库的实例 里的方法大部分是自定义
    const permissionStore = usePermissionStore() // 获取权限状态管理实例 存放用户能看到的菜单、能按的按钮、能走的路由
    if (!userStore.userInfo) { // 判断用户信息是否为空（通常为刷新页面导致内存状态丢失的情况）
      const [user, permissions] = await Promise.all([getUserInfo(), getPermissions()])// 两个函数是数据库取数据
      // 数组解构赋值写法 user和per分别接收右边数组的第一第二的返回值 写法是const [user, permissions] =[ ]
      // Promise是系统自带的异步容器 类似凭证的作用 all作用是数组都获取到返回值才会显示成功统一赋值 一般是传数组
      // 加上异步 await才会等到后面两个函数返回值的真实数据 不加异步只是把返回值（pro对象给赋值）
      // 两个函数的作用就是取数据（返回值就是pro 异步才可以获取 纯数据）本质其实就是仓库实例的方法 现在是独立外包出来结构更好
      userStore.setUser(user) // 将获取到的用户信息存入 setUser存数据函数
      permissionStore.setPermissions(permissions) // 将获取到的权限列表存入 permissionStore，此动作通常会生成动态路由表 (accessRoutes)
      const routeComponents = import.meta.glob('@/views/**/*.vue')
      // 使用 Vite 的 import.meta.glob 获取 views 目录下所有的 vue 文件，返回懒加载函数的映射对象
      //  glob是vite独有全局批量导入文件  **: 匹配任意层级的子目录 *: 单星号，匹配任意文件名。
      permissionStore.accessRoutes.forEach((route) => {
        // 遍历权限 store 中计算得出的动态路由配置 forEach数组自带遍历
        // accessRoutes自定义属性（数组）存储后端返回的数据通过pinia转换成路由配置表
        // foreach是accessRoutes调用 route就是数组里的元素 for函数的作用就是把数组内每个元素都做参数调用箭头
        // acc调用的箭头函数 acc就是路由配置数组和basicRoutes一样 之是前者是后端发出的里面的com只是字符串后者是开发者写的直接拿到函数
        // glob的作用就是把组件目录的文件写成键位 []取值字符串就找到对应的函数
        // component 在 store 阶段是字符串（AccessRoute），此处替换为 glob 的懒加载组件
        route.component = routeComponents[route.component as string] || undefined
        // 将路由配置中的组件路径字符串，替换为 glob 映射出的实际懒加载组件函数；若未匹配到则设为 undefined
        // component 后端接口返回表示组件位置的字符串
        // routeComponents[route.component]中 []就是取值 从前者中根据键位取值 com还只是字符串
        // || undefined 就是或者基于und防止没有值
        !router.hasRoute(route.name!) && router.addRoute(route as RouteRecordRaw)
        // &&与 在这里其实就是if的作用 hasRoute路由检查器   addRoute路由添加
      })
      return { ...to, replace: true } as RouteLocationRaw
      // 返回目标路由对象并设置 replace: true 会变成返回到类似这样{ path: '/b', query: ..., replace: true }。
      // replace: true替换当前记录[A, B, B] 变成[A, B]为了后退键
      // 去到用户信息后重新去到b页面 也就是重新执行一次这个路由 第二次运行直接跳到下面
    }

    const routes = router.getRoutes()
    // 若已有用户信息，获取当前路由器中已注册的所有路由记录 返回是数组
    // getRoutes()返回的是经过vue routes加工的路由配置表
    if (routes.some(route => route.name === to.name))
      // 判断已注册的路由中是否存在与目标路由同名的路由
    // some数组自带方法 遍历查询匹配就输出true
    // route => route.name === to.name是箭头函数的极简 (route) => {return route.name === to.name;}
      return true // 若是已注册的合法路由，直接放行

    // 判断是无权限还是404 // 注释说明：走到这里说明路由未注册，需排查是权限不足还是页面不存在
    const { data: hasMenu } = await api.validateMenuPath(to.path)
    // 请求后端接口，校验当前用户是否有该路径对应的菜单权限
    // 从右边查找data的值 把值给到hasmenu
    // api就是对象 函数是网络请求函数 验证to是否有权限
    return hasMenu // 根据后端返回结果进行判断  是后端data传回来的数据要么对要么错
      ? { name: '403', query: { path: to.fullPath }, state: { from: 'permission-guard' } } // 有菜单权限但路由未注册（可能是路由配置缺失），重定向到 403 无权限页，携带原路径和来源标识
      : { name: '404', query: { path: to.fullPath } } // 无菜单权限且路由未注册，说明页面不存在，重定向到 404 页面，携带原路径
        // return a?b :c 这个结构  重定向query是URL 查询参数 网址中?后面的内容 fullPath用户原本想跳转的地址
        // state：历史记录状态 后面是备注开发者可见
  })
}
/*
console.log("1. 脚本开始");

async function getData() {
    console.log("2. 函数开始执行");
    await fetch('https://api.example.com/data'); // 假设这要2秒
    console.log("6. 数据回来了，函数恢复执行");
}
getData(); // 调用函数
console.log("4. 函数虽然暂停了，但我（主线程）没有停！");
console.log("5. 我依然可以先跑起来，处理页面点击等事情");
这就是await异步的逻辑 函数暂停了 会继续运行函数以外的等返回值回来再继续运行函数
await 只能在 async 函数内部使用
├─ 规则1：使用 await 的函数必须声明为 async
├─ 规则2：async 函数会自动将返回值包装成 Promise
└─ 规则3：getUserInfo() 内部如果用 await，它本身必须是 async 函数

*/
/*
                                开始: 路由跳转
                                     │
                                     ▼
                               [是否有 Token?]
                     ┌───────────────────┴───────────────────┐
                 [无 Token]                              [有 Token]
                      │                                       │
                      ▼                                       ▼
                [是否在白名单?]                         [是否是登录页?]
               ┌────────┴────────┐                     ┌────────┴────────┐
             [是]              [否]                 [是]              [否]
               │                  │                     │                  │
               ▼                  ▼                     ▼                  ▼
             放行              去登录页                跳首页        [是否在白名单?]
                                                           ┌────────┴────────┐
                                                         [是]              [否]
                                                           │                  │
                                                           ▼                  ▼
                                                         放行           [是否有用户信息?]
                                                                         ┌────────┴────────┐
                                                                     [无 (刷新)]          [有]
                                                                         │                  │
                                                                         ▼                  ▼
                                                                 ┌──────────────────────┐  [路由是否已注册?]
                                                                 │     步骤 3           │  ┌────────┴────────┐
                                                                 │  并发获取数据        │ [是]             [否]
                                                                 │  存入 Store          │   │                 │
                                                                 │  扫描 & 注册路由      │   ▼                 ▼
                                                                 │  重定向 replace:true  │  放行          [后端校验路径权限?]
                                                                 └──────────┬───────────┘                 ┌────────┴────────┐
                                                                            │ (重新触发守卫)               [是]             [否]
                                                                           ─┼────────────────────┬──────────┘               │
                                                                           │                     │                          ▼
                                                                           │                  (合并)                     404页面
                                                                           │                     │
                                                                           └─────────────────────┤
                                                                                                 ▼
                                                                                              403页面

*/
