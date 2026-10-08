import type { Plugin } from 'vite'
import { getPagePathes } from '..'

// 虚拟模块 id，业务侧 import pagePathes from 'isme:page-pathes' 拿到页面路径列表
const PLUGIN_PAGE_PATHES_ID = 'isme:page-pathes'

/**
 * vite 虚拟模块插件：构建期把 getPagePathes() 结果注入 isme:page-pathes 模块
 */
export function pluginPagePathes(): Plugin {
  return {
    name: 'isme:page-pathes',
    // 命中虚拟 id 时加 \0 前缀标记，避免被当作真实文件解析
    resolveId(id) {
      if (id === PLUGIN_PAGE_PATHES_ID)
        return `\0${PLUGIN_PAGE_PATHES_ID}`
    },
    load(id) {
      if (id === `\0${PLUGIN_PAGE_PATHES_ID}`)
        return `export default ${JSON.stringify(getPagePathes())}`
    },
  }
}
