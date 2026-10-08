/**
 * 自定义虚拟模块的类型声明，模块内容由 build/plugin-isme 下的 vite 插件在构建期注入
 */

declare module 'isme:icons' {
  /** getIcons() 的产出：动态图标 + feather/isme 目录下全部 svg 图标名，如 'i-fe:activity' */
  const icons: string[]
  export default icons
}

declare module 'isme:page-pathes' {
  /** getPagePathes() 的产出：src/views 下全部页面路径，如 '/src/views/home/index.vue' */
  const pagePathes: string[]
  export default pagePathes
}
