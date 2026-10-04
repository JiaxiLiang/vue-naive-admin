import type { IconName } from '../src/types/icons'
import path from 'node:path'
import { globSync } from 'glob'
import dynamicIcons from '../src/assets/icons/dynamic-icons'

/**
 * 生成 icons，用于 unocss safelist，以支持页面动态渲染自定义图标
 */
export function getIcons(): IconName[] {
  const feFiles = globSync('src/assets/icons/feather/*.svg', { nodir: true })
  const meFiles = globSync('src/assets/icons/isme/*.svg', { nodir: true })
  const toIcon = (prefix: 'i-fe' | 'i-me') => (filePath: string): IconName =>
    `${prefix}:${path.parse(path.basename(filePath)).name}`
  const feIcons = feFiles.map(toIcon('i-fe'))
  const meIcons = meFiles.map(toIcon('i-me'))

  return [...dynamicIcons, ...feIcons, ...meIcons]
}

/**
 * 生成 .vue 文件路径列表，用于添加菜单时可下拉选择对应的 .vue 文件路径，防止手动输入报错
 */
export function getPagePathes(): string[] {
  const files = globSync('src/views/**/*.vue')
  return files.map(item => `/${path.normalize(item).replace(/\\/g, '/')}`)
}
