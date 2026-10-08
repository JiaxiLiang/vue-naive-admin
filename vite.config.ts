import path from 'node:path'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import removeNoMatch from 'vite-plugin-router-warn'
import VueDevTools from 'vite-plugin-vue-devtools'
import { pluginIcons, pluginPagePathes } from './build/plugin-isme'

export default defineConfig(({ mode }) => {
  // 加载当前 mode 对应的 .env 文件，取出部署路径与代理目标
  const viteEnv = loadEnv(mode, process.cwd())
  const { VITE_PUBLIC_PATH, VITE_PROXY_TARGET } = viteEnv

  return {
    // 部署在子路径时通过 env 指定资源公共前缀
    base: VITE_PUBLIC_PATH || '/',
    plugins: [
      Vue(),
      VueJsx(),
      VueDevTools(),
      Unocss(),
      // vue/vue-router API 自动按需导入；dts 产出 auto-imports.d.ts 供 typecheck
      AutoImport({
        imports: ['vue', 'vue-router'],
        dts: true,
      }),
      // 模板组件自动注册，NaiveUiResolver 使 n-* 组件免手动引入；dts 产出 components.d.ts 供 typecheck
      Components({
        resolvers: [NaiveUiResolver()],
        dts: true,
      }),
      // 自定义虚拟模块插件：注入页面路径列表与图标名集合
      pluginPagePathes(),
      pluginIcons(),
      // 屏蔽动态路由注册前访问路径触发的 vue-router No match found 警告
      removeNoMatch(),
    ],
    // 路径别名：@ 指 src 目录，~ 指项目根
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
        '~': path.resolve(process.cwd()),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3200,
      open: false,
      // 代理配置：解决本地开发跨域，/api 前缀请求转发到后端并重写掉前缀
      proxy: {
        '/api': {
          target: VITE_PROXY_TARGET,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
          secure: false,
          configure: (proxy, options) => {
            // 调试用：把实际转发目标写进响应头 x-real-url，便于确认代理是否生效
            proxy.on('proxyRes', (proxyRes, req) => {
              const target = typeof options.target === 'string' ? options.target : undefined
              proxyRes.headers['x-real-url'] = target ? new URL(req.url || '', target)?.href || '' : ''
            })
          },
        },
      },
    },
    optimizeDeps: {
      // 强制预构建，避免该依赖首次被按需发现时触发依赖重新优化导致页面整体刷新
      include: ['vue3-intro-step'],
    },
    build: {
      // 单 chunk 体积警告阈值（kb），适当放宽减少无效告警
      chunkSizeWarningLimit: 1024,
    },
  }
})
