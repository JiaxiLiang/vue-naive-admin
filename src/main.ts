// import就是引用模块函数 createApp函数是vue创建应用实例的函数
// {}是目标文件里面的具体函数或者变量 无{}就是默认导出
import { darkTheme } from 'naive-ui' // Naive UI 暗黑主题（离散 API 主题跟随 app store 用）
import { createApp } from 'vue' // 从Vue框架导入createApp函数，用于创建Vue应用实例
import App from './App.vue' // 导入根组件App.vue，这是整个应用的入口组件

import { setupDirectives } from './directives' // 从directives目录导入setupDirectives函数
// 用于注册自定义指令，如权限控制、权限码等
import { setupRouter } from './router' // 从router目录导入setupRouter函数
// 用于设置路由配置和路由守卫
import { setupStore, useAppStore, useAuthStore } from './store' // 从store目录导入setupStore函数与所需仓库
// 用于设置Pinia状态管理
import { setupHttpAuth, setupNaiveDiscreteApi } from './utils' // 从utils导入 http 认证注入与 NaiveUI 离散 API 装配
// utils 层不反向依赖 store，认证能力与主题都由入口在此注入

import '@/styles/reset.css' // 导入CSS重置样式文件重置浏览器默认样式
// @就是指代src文件
import '@/styles/global.css' // 导入全局样式文件，包含项目全局CSS变量和通用样式
import 'uno.css' // 导入UnoCSS样式文件，UnoCSS是原子化CSS引擎

async function bootstrap() { // 定义异步bootstrap函数，作为应用的启动入口
// async：声明函数为异步函数 异步操作：不阻塞主线程的代码执行，允许程序在等待结果时继续执行其他任务
  const app = createApp(App) // createApp函数创建Vue应用实例，
  // 传入根组件App，返回的app对象包含mount、use等方法
  setupStore(app) // 注册 Pinia 状态管理，将 Pinia store 挂载到 Vue 实例上。
  setupDirectives(app) // 设置自定义指令，注册如v-permission、v-role等权限相关指令
  await setupRouter(app) // 设置路由系统
  // await 关键字：暂停 bootstrap 函数的执行，等待 setupRouter(app) 完成后再继续。
  app.mount('#app') // #是CSS选择器，表示id为app的DOM元素 ''是dom操作得用字符串
  // mount 方法会将 Vue 实例的模板渲染到指定的 DOM 元素中，并启动应用的生命周期。
  // NaiveUI 离散 API：主题以 ComputedRef 注入，跟随 app store 的暗黑/主题色变化（装配须在 store 就绪后）

  // 认证能力注入 http 层（token 读取 + 过期登出），保持 utils 不反向依赖 store
  setupHttpAuth({
    getAccessToken: () => useAuthStore().accessToken,
    logout: () => useAuthStore().logout(),
  })

  const appStore = useAppStore()
  setupNaiveDiscreteApi(computed(() => ({
    theme: appStore.isDark ? darkTheme : undefined,
    themeOverrides: appStore.naiveThemeOverrides,
  })))
  // 设置NaiveUI的离散API，提供如message、dialog、notification等独立调用方式
}

bootstrap() // 调用bootstrap函数启动应用，执行上述所有初始化步骤
/*
异步
==============================================================
【第一阶段：主线程执行同步代码】
说白就是顺序同步执行完全部 再执行先到的异步返回值
==============================================================
时间轴 ▼
[步骤 1] 执行 同步代码 A
    |
    V
[步骤 2] 调用 异步函数 B
    |   |-- 发现是异步 ->函数 B 内部 await 之后的代码暂停，等待后续
    V
[步骤 3] 执行 同步代码 C
    |
    V
[步骤 4] 调用 异步函数 D
    |   |-- 发现是异步 -> 函数 D 内部 await 之后的代码暂停，等待后续
    V
[步骤 5] 执行 同步代码 E
    |
    V
[检查点] 主线程: 也就是整个文件完整顺序执行一次
==============================================================
==============================================================
【第二阶段：后台处理 & 任务队列排队】
谁先返回值 谁就像排队
==============================================================
[后台处理 D] -> (速度快) -> 完成！
    |   '-- 动作: 把 <回调 D> 放入 [任务队列] 的头部
[后台处理 B] -> (速度慢) -> 还在跑... 还在跑... 终于完成！
    |   '-- 动作: 把 <回调 B> 放入 [任务队列] 的尾部
    V
==============================================================
【第三阶段：事件循环】
先到先排
==============================================================

[步骤 6] 主线程从队列取出第一个: <回调 D>
    |   '-- 执行异步函数 D 剩下的代码
    V
[步骤 7] 主线程从队列取出第二个: <回调 B>
    |   '-- 执行异步函数 B 剩下的代码
    V
[结束] 队列空了，程序结束

*/
/*
闭包
闭包得要同时满足自然数调用父函数的变量且父函数return子函数同时满足两点
// 1. 【父函数】
function parentFunc() {
    let data = 100; // 父函数的局部变量
    // 2. 【子函数】
    // 必须满足点1：子函数调用了父函数的 data
    function childFunc() {
        console.log(data);
    }
    // 必须满足点2：父函数返回了子函数
    return childFunc;
}

// --- 执行 ---

// 3. 父函数执行完毕，按理说 data 应该消失
const myClosure = parentFunc();

// 4. 但因为闭包，data 还活着！
myClosure(); // 输出: 100

*/
/*
代码执行步骤顺序：
1. 导入必要的模块和组件 初始化vue应用实例
2. 定义bootstrap异步函数
     创建Vue应用实例
     设置状态管理——让多个组件能共享和修改同一份数据，保持数据一致性。
            Vuex是一个状态管理库（插件）它提供store（状态容器）
     设置自定义指令——自定义指令用于DOM操作，在模板中直接使用
     设置路由系统（异步操作）——Vue Router是一个插件
     挂载应用到DOM——Vue实例叫app，同时DOM中的HTML也有一个app元素
     设置NaiveUI的离散API
9. 调用bootstrap函数启动整个应用
*/
// URL对应Vue组件，URL变化时Vue Router在原DOM上切换组件，保留原DOM，不刷新页
// 路由守卫控制路由切换前后的数据，改变什么，不能动什么
