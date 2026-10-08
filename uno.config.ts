import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'
import presetRemToPx from '@unocss/preset-rem-to-px'
import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss'
import { getIcons } from './build/index'

// 与虚拟模块 isme:icons 同一数据源，保证 safelist 覆盖项目全部图标
const icons = getIcons()
export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      warn: true,
      prefix: ['i-'],
      // 图标按 1em 内联块渲染，天然与文字对齐
      extraProperties: {
        display: 'inline-block',
        width: '1em',
        height: '1em',
      },
      // 自定义图标集从本地 svg 目录加载
      collections: {
        me: FileSystemIconLoader('./src/assets/icons/isme'),
        fe: FileSystemIconLoader('./src/assets/icons/feather'),
      },
    }),
    // rem 转 px 且基准 1rem = 4px，使 p-8 这类数值直接对应像素间距
    presetRemToPx({ baseFontSize: 4 }),
  ],
  // safelist 预生成全部图标类名：动态拼接的类名扫描不到；?mask 变体让图标继承文字颜色
  safelist: icons.map(icon => `${icon} ${icon}?mask`.split(' ')).flat(),
  // 常用样式组合的语义化简写，统一项目内的布局/配色写法
  shortcuts: [
    ['wh-full', 'w-full h-full'],
    ['f-c-c', 'flex justify-center items-center'],
    ['flex-col', 'flex flex-col'],
    ['card-border', 'border border-solid border-light_border dark:border-dark_border'],
    ['auto-bg', 'bg-white dark:bg-dark'],
    ['auto-bg-hover', 'hover:bg-#eaf0f1 hover:dark:bg-#1b2429'],
    ['auto-bg-highlight', 'bg-#eaf0f1 dark:bg-#1b2429'],
    ['text-highlight', 'rounded-4 px-8 py-2 auto-bg-highlight'],
    ['f-card', 'auto-bg rounded-8 card-shadow'],
    ['f-card-hover', 'transition-shadow-300 hover:shadow-[0_6px_16px_-4px_#0000001f,0_12px_28px_2px_#00000017]'],
    ['glass-bar', 'bg-white/70 dark:bg-#18181c/72 backdrop-blur-16px'],
    ['sider-dark', 'bg-#18181c dark:bg-#101014 text-white'],
    ['brand-gradient', 'bg-gradient-to-r from-#2F54EB to-#13C2C2'],
    ['brand-gradient-text', 'brand-gradient bg-clip-text text-transparent'],
  ],
  rules: [
    // 自定义卡片阴影规则，供 f-card 等 shortcut 复用
    [
      'card-shadow',
      { 'box-shadow': '0 1px 2px -2px #00000029, 0 3px 6px #0000001f, 0 5px 12px 4px #00000017' },
    ],
  ],
  theme: {
    colors: {
      // primary 走 CSS 变量以支持运行时换肤
      primary: 'rgba(var(--primary-color))',
      dark: '#18181c',
      light_border: '#efeff5',
      dark_border: '#2d2d30',
    },
  },
})
