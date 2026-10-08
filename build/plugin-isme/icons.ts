import type { Plugin } from 'vite'
import { getIcons } from '..'

// 虚拟模块 id，业务侧 import icons from 'isme:icons' 即可拿到图标名集合
const PLUGIN_ICONS_ID = 'isme:icons'

/**
 * vite 虚拟模块插件：构建期把 getIcons() 结果序列化注入 isme:icons 模块，
 * 让图标集合参与打包而无需落盘真实文件
 */
export function pluginIcons(): Plugin {
  return {
    name: 'isme:icons',
    // 命中虚拟 id 时加 \0 前缀标记，避免被当作真实文件解析
    resolveId(id) {
      if (id === PLUGIN_ICONS_ID)
        return `\0${PLUGIN_ICONS_ID}`
    },
    load(id) {
      if (id === `\0${PLUGIN_ICONS_ID}`)
        return `export default ${JSON.stringify(getIcons())}`
    },
  }
}
