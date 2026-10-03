// 数组的格式是vue router规定的配置格式
// 作用就是路由实例在接收不同的 url 的时候就会在 basicRoutes 中调用对应页面的配置信息
import type { RouteRecordRaw } from 'vue-router'

export const basicRoutes = [ // 导出常量basicRoutes，定义为数组，包含应用的基础路由配置（无需权限的公共路由）
  { // 登录页路由配置对象
    name: 'Login', // 路由名称：Login，用于路由跳转标识（如router.push({ name: 'Login' })）
    path: '/login', // 路由路径：/login，浏览器地址栏显示的URL路径
    component: () => import('@/views/login/index.vue'),
    // 当 URL 匹配时，Vue Router 需要知道渲染哪个组件。@就是src文件
    meta: { // 路由元信息对象：存储路由附加信息，如页面标题、布局设置
      title: '登录页', // 页面标题：用于文档标题或面包屑显示
      layout: 'empty', // 布局设置：empty表示使用空白布局（无侧边栏、无顶部导航）
    }, // meta元信息定义结束
  }, // 登录页路由配置结束

  { // 首页路由配置对象
    name: 'Home', // 路由名称：Home
    path: '/', // 路由路径：/，应用的根路径
    component: () => import('@/views/home/index.vue'), // 组件懒加载：动态导入首页组件
    meta: { // 路由元信息对象
      title: '首页', // 页面标题：首页
    }, // meta元信息定义结束
  }, // 首页路由配置结束

  { // 404错误页路由配置对象
    name: '404', // 路由名称：404
    path: '/404', // 路由路径：/404
    component: () => import('@/views/error-page/404.vue'), // 组件懒加载：动态导入404错误页组件
    meta: { // 路由元信息对象
      title: '页面飞走了', // 页面标题：自定义的404提示文案
      layout: 'empty', // 布局设置：empty表示使用空白布局
    }, // meta元信息定义结束
  }, // 404路由配置结束

  { // 403错误页路由配置对象
    name: '403', // 路由名称：403
    path: '/403', // 路由路径：/403
    component: () => import('@/views/error-page/403.vue'), // 组件懒加载：动态导入403错误页组件
    meta: { // 路由元信息对象
      title: '没有权限', // 页面标题：无权限提示文案
      layout: 'empty', // 布局设置：empty表示使用空白布局
    }, // meta元信息定义结束
  }, // 403路由配置结束
] satisfies RouteRecordRaw[] // basicRoutes数组定义结束（satisfies 保留字面量精确类型）
/*
  代码执行步骤顺序：

  1. 【常量声明与导出】
     - 第1行：声明并导出常量`basicRoutes`，初始化为一个空数组，准备存放路由配置对象。

  2. 【登录路由配置】
     - 第2-10行：向数组中添加第一个路由对象。
     - 细节：配置`name`为'Login'，`path`为'/login'。
     - 细节：设置`component`为箭头函数，实现组件的懒加载（按需导入）。
     - 细节：定义`meta`元信息，设置标题和布局模式为'empty'。

  3. 【首页路由配置】
     - 第12-19行：向数组中添加第二个路由对象。
     - 细节：配置`name`为'Home'，`path`为'/'（根路径）。
     - 细节：设置`component`懒加载首页组件。
     - 细节：定义`meta`元信息，设置标题为'首页'，未指定布局则默认使用基础布局。

  4. 【404错误页配置】
     - 第21-30行：向数组中添加第三个路由对象。
     - 细节：配置`name`为'404'，`path`为'/404'。
     - 细节：设置`component`懒加载404组件。
     - 细节：定义`meta`元信息，设置标题和布局模式为'empty'。

  5. 【403错误页配置】
     - 第32-41行：向数组中添加第四个路由对象。
     - 细节：配置`name`为'403'，`path`为'/403'。
     - 细节：设置`component`懒加载403组件。
     - 细节：定义`meta`元信息，设置标题和布局模式为'empty'。

  6. 【配置完成】
     - 第42行：闭合数组定义，`basicRoutes`常量赋值完成，可供路由实例使用。
*/
