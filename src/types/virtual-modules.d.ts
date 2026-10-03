/**
 * 自定义虚拟模块声明（由 build/plugin-isme 下的 vite 插件在构建时注入）
 */

declare module 'isme:icons' {
  /** getIcons() 的返回值：动态图标 + feather/isme 目录下所有 svg 图标名，如 'i-fe:activity' */
  const icons: string[]
  export default icons
}

declare module 'isme:page-pathes' {
  /** getPagePathes() 的返回值：src/views 下所有 .vue 文件路径，如 '/src/views/home/index.vue' */
  const pagePathes: string[]
  export default pagePathes
}
