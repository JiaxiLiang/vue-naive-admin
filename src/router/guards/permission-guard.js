import api from '@/api' // 导入封装好的 API 请求模块，用于后端接口调用
import { useAuthStore, usePermissionStore, useUserStore } from '@/store' // 从统一状态管理目录导入认证、权限和用户相关的 Pinia Store 钩子
import { getPermissions, getUserInfo } from '@/store/helper' // 导入获取用户信息和权限列表的辅助函数

const WHITE_LIST = ['/login', '/404'] // 定义路由白名单常量，包含无需登录即可访问的路径
export function createPermissionGuard(router) { // 导出创建权限守卫的函数，接收 router 实例作为参数
  router.beforeEach(async (to) => { // 注册全局前置守卫，使用 async 使内部支持异步操作，to 为目标路由对象
    const authStore = useAuthStore() // 获取认证状态管理实例
    const token = authStore.accessToken // 从 store 中获取用户的访问令牌

    /** 没有token */ // 注释说明：处理未登录（无令牌）的情况
    if (!token) { // 判断令牌是否存在
      if (WHITE_LIST.includes(to.path)) // 若无令牌，判断目标路径是否在白名单内
        return true // 在白名单内，直接放行，允许跳转
      return { path: 'login', query: { ...to.query, redirect: to.path } } // 不在白名单，拦截并重定向到登录页，同时将原本要去的路径作为 redirect 参数携带，以便登录后回跳
    } // 结束无 token 判断逻辑块

    // 有token的情况 // 注释说明：处理已登录（有令牌）的情况
    if (to.path === '/login') // 若已登录且目标路径是登录页
      return { path: '/' } // 拦截并重定向到首页，避免已登录用户再次进入登录页
    if (WHITE_LIST.includes(to.path)) // 若已登录且目标路径在白名单内（如 404）
      return true // 直接放行

    const userStore = useUserStore() // 获取用户状态管理实例
    const permissionStore = usePermissionStore() // 获取权限状态管理实例
    if (!userStore.userInfo) { // 判断用户信息是否为空（通常为刷新页面导致内存状态丢失的情况）
      const [user, permissions] = await Promise.all([getUserInfo(), getPermissions()]) // 并发请求获取用户信息和权限列表，等待两者均完成
      userStore.setUser(user) // 将获取到的用户信息存入 userStore
      permissionStore.setPermissions(permissions) // 将获取到的权限列表存入 permissionStore，此动作通常会生成动态路由表 (accessRoutes)
      const routeComponents = import.meta.glob('@/views/**/*.vue') // 使用 Vite 的 import.meta.glob 获取 views 目录下所有的 vue 文件，返回懒加载函数的映射对象
      permissionStore.accessRoutes.forEach((route) => { // 遍历权限 store 中计算得出的动态路由配置
        route.component = routeComponents[route.component] || undefined // 将路由配置中的组件路径字符串，替换为 glob 映射出的实际懒加载组件函数；若未匹配到则设为 undefined
        !router.hasRoute(route.name) && router.addRoute(route) // 如果路由器中尚未注册该名称的路由，则动态添加该路由到路由器实例中
      }) // 结束遍历动态路由
      return { ...to, replace: true } // 返回目标路由对象并设置 replace: true，意为重新导航到原目标，确保刚添加的动态路由能被正确解析匹配，且不保留当前错误的历史记录
    } // 结束无用户信息判断逻辑块

    const routes = router.getRoutes() // 若已有用户信息，获取当前路由器中已注册的所有路由记录
    if (routes.some(route => route.name === to.name)) // 判断已注册的路由中是否存在与目标路由同名的路由（即验证是否为合法注册路由）
      return true // 若是已注册的合法路由，直接放行

    // 判断是无权限还是404 // 注释说明：走到这里说明路由未注册，需排查是权限不足还是页面不存在
    const { data: hasMenu } = await api.validateMenuPath(to.path) // 请求后端接口，校验当前用户是否有该路径对应的菜单权限
    return hasMenu // 根据后端返回结果进行判断
      ? { name: '403', query: { path: to.fullPath }, state: { from: 'permission-guard' } } // 有菜单权限但路由未注册（可能是路由配置缺失），重定向到 403 无权限页，携带原路径和来源标识
      : { name: '404', query: { path: to.fullPath } } // 无菜单权限且路由未注册，说明页面不存在，重定向到 404 页面，携带原路径
  }) // 结束 beforeEach 守卫回调函数
} // 结束 createPermissionGuard 函数定义

/*
代码执行步骤顺序：
1. 初始化准备：导入所需 API、Store 及辅助函数，定义无需权限的白名单路径。
2. 注册前置守卫：在路由跳转前执行 async 回调函数。
3. Token 校验（无 Token 分支）：
   - 获取 Token，若无 Token，检查目标路径是否在白名单内。
   - 白名单内直接放行；不在白名单则拦截并重定向至登录页，携带 redirect 参数。
4. Token 校验（有 Token 分支）：
   - 若目标路径是登录页，重定向至首页防止重复登录。
   - 若目标路径在白名单内（如 404），直接放行。
5. 动态路由加载（刷新页面恢复状态）：
   - 检查内存中是否存在用户信息，若不存在（刷新导致丢失）：
   - 并发请求获取用户信息与权限列表，并分别存入对应 Store。
   - 通过 import.meta.glob 获取所有视图组件的懒加载映射。
   - 遍历权限 Store 生成的动态路由表，将组件路径字符串映射为实际的懒加载函数。
   - 将不存在的动态路由通过 router.addRoute 动态添加到路由实例中。
   - 触发重定向 `{ ...to, replace: true }`，重新解析路由以确保刚添加的路由生效。
6. 已有用户信息分支：
   - 若已存在用户信息，获取当前路由器所有路由记录。
   - 检查目标路由是否已注册，若已注册则直接放行。
7. 异常路由兜底判断（未注册路由）：
   - 若目标路由未注册，调用后端接口验证该路径是否属于用户拥有的菜单。
   - 若后端确认有菜单权限（属于权限内但前端未配置路由），重定向至 403 页面。
   - 若后端确认无菜单权限（完全非法路径），重定向至 404 页面。
*/
