import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'
import presetRemToPx from '@unocss/preset-rem-to-px'
import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss'
import { getIcons } from './build/index'

const icons = getIcons()
export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      warn: true,
      prefix: ['i-'],
      extraProperties: {
        display: 'inline-block',
        width: '1em',
        height: '1em',
      },
      collections: {
        me: FileSystemIconLoader('./src/assets/icons/isme'),
        fe: FileSystemIconLoader('./src/assets/icons/feather'),
      },
    }),
    presetRemToPx({ baseFontSize: 4 }),
  ],
  safelist: icons.map(icon => `${icon} ${icon}?mask`.split(' ')).flat(),
  shortcuts: [
    ['wh-full', 'w-full h-full'],
    ['f-c-c', 'flex justify-center items-center'],
    ['flex-col', 'flex flex-col'],
    ['card-border', 'border border-solid border-light_border dark:border-dark_border'],
    ['auto-bg', 'bg-white dark:bg-dark'],
    ['auto-bg-hover', 'hover:bg-#eaf0f1 hover:dark:bg-#1b2429'],
    ['auto-bg-highlight', 'bg-#eaf0f1 dark:bg-#1b2429'],
    ['text-highlight', 'rounded-4 px-8 py-2 auto-bg-highlight'],
    // ── soybean 视觉语言资产：浮卡 / 悬浮抬升 / 毛玻璃栏 / 暗色侧栏 / 品牌渐变 ──
    ['f-card', 'auto-bg rounded-8 card-shadow'],
    ['f-card-hover', 'transition-shadow-300 hover:shadow-[0_6px_16px_-4px_#0000001f,0_12px_28px_2px_#00000017]'],
    ['glass-bar', 'bg-white/70 dark:bg-#18181c/72 backdrop-blur-16px'],
    ['sider-dark', 'bg-#18181c dark:bg-#101014 text-white'],
    ['brand-gradient', 'bg-gradient-to-r from-#2F54EB to-#13C2C2'],
    ['brand-gradient-text', 'brand-gradient bg-clip-text text-transparent'],
  ],
  rules: [
    [
      'card-shadow',
      { 'box-shadow': '0 1px 2px -2px #00000029, 0 3px 6px #0000001f, 0 5px 12px 4px #00000017' },
    ],
  ],
  theme: {
    colors: {
      primary: 'rgba(var(--primary-color))',
      dark: '#18181c',
      light_border: '#efeff5',
      dark_border: '#2d2d30',
    },
  },
})
