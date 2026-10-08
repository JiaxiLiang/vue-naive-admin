import type { IconName } from '../src/types/icons'
import path from 'node:path'
import { globSync } from 'glob'
import dynamicIcons from '../src/assets/icons/dynamic-icons'

/**
 * 收集项目全部可用图标名（动态注册 + feather/isme 目录下的 svg），供 unocss safelist 使用，
 * 使运行时动态拼接的图标类名也能被预生成样式
 */
export function getIcons(): IconName[] {
  // nodir 只命中文件，排除同名目录
  const feFiles = globSync('src/assets/icons/feather/*.svg', { nodir: true })
  const meFiles = globSync('src/assets/icons/isme/*.svg', { nodir: true })
  // 从文件名提取图标名并拼上集合前缀，如 activity.svg -> 'i-fe:activity'
  const toIcon = (prefix: 'i-fe' | 'i-me') => (filePath: string): IconName =>
    `${prefix}:${path.parse(path.basename(filePath)).name}`
  const feIcons = feFiles.map(toIcon('i-fe'))
  const meIcons = meFiles.map(toIcon('i-me'))

  return [...dynamicIcons, ...feIcons, ...meIcons]
}

/**
 * 收集 src/views 下全部页面路径，供菜单管理下拉选择组件路径，避免手动输入出错
 */
export function getPagePathes(): string[] {
  const files = globSync('src/views/**/*.vue')
  // 统一成以 / 开头的 posix 风格路径（windows 下需替换反斜杠）
  return files.map(item => `/${path.normalize(item).replace(/\\/g, '/')}`)
}
