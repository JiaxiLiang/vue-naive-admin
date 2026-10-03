// Store 根实例：创建并导出 Store 对象  store就是仓库的意思
import type { App } from 'vue'
import { createPinia } from 'pinia' // 引入 Pinia 状态管理库的核心创建方法
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// 引入状态持久化插件，解决页面刷新导致状态丢失的问题
// 第三方插件 把pinia的数据主题颜色语言等全局数据复制到浏览器存储不用一直后端调用
// 核心的权限除外
export function setupStore(app: App): void { // 定义并导出 Store 的初始化工厂函数，接收 Vue 应用实例 app 作为参数
  const pinia = createPinia() // 创建 Pinia 的根实例对象
  pinia.use(piniaPluginPersistedstate) // 为当前 Pinia 实例注册持久化插件，使其具备自动同步本地存储的能力
  app.use(pinia) // 将配置好的 Pinia 实例作为插件挂载到 Vue 应用上，使其全局可用
}
// js是动态语言 不管参数是什么只要是有use方法就可以 静态语言c++ java ts等就是要对参数的定义 引用等严格要求
// 动态和静态 还有动态的变量随便赋值
export * from './modules' // 把.（当前目录）的modules 目录下的所有导出的函数整合在这里再一次导出
// 方便外部导出直接写import { useUserSt } from '@/store' // 路径很短，很清爽

/*
代码步骤顺序：
1. 【引入依赖】：在文件顶部引入 Pinia 核心方法和持久化插件。
2. 【定义初始化函数】：声明 setupStore 函数，接收主应用实例，用于后续在 main.js 中统一挂载。
3. 【创建实例】：在函数内部调用 createPinia() 生成状态管理根实例。
4. 【注册插件】：通过 pinia.use() 为实例注入持久化能力。
5. 【挂载应用】：通过 app.use() 将 Pinia 完整接入 Vue 应用生态。
6. 【统一导出模块】：执行 export * 语句，向外聚合暴露所有按业务拆分的状态模块（如 auth, user, permission 等）。
*/
