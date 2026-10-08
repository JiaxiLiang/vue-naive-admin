import type { Linter } from 'eslint'
import antfu from '@antfu/eslint-config'

/**
 * 生成 no-restricted-imports 规则，把「下层不得引用上层」的分层依赖约束交给 lint 机器化执行
 * @param layers 禁止引用的上层目录名（同时拦截 @/<layer> 与 @/<layer>/* 两种导入写法）
 */
function upperLayerPatterns(layers: string[]): Linter.RulesRecord {
  return {
    'no-restricted-imports': ['error', {
      patterns: layers.flatMap(layer => [
        { group: [`@/${layer}`, `@/${layer}/*`], message: `分层依赖方向违规：下层不得引用 @/${layer}` },
      ]),
    }],
  }
}

export default antfu({
  unocss: true,
  formatters: true,
  stylistic: true,
  // 关闭与项目现状冲突的默认规则
  rules: {
    'n/prefer-global/process': 'off',
    'no-undef': 'error',
    'no-fallthrough': 'off',
    'vue/block-order': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    'prefer-promise-reject-errors': 'off',
  },
  // 声明自动导入的 API 与 naive-ui 全局挂载对象，避免 no-undef 误报
  languageOptions: {
    globals: {
      h: 'readonly',
      unref: 'readonly',
      provide: 'readonly',
      inject: 'readonly',
      markRaw: 'readonly',
      defineAsyncComponent: 'readonly',
      nextTick: 'readonly',
      onScopeDispose: 'readonly',
      useRoute: 'readonly',
      useRouter: 'readonly',
      Message: 'readonly',
      $loadingBar: 'readonly',
      $message: 'readonly',
      $dialog: 'readonly',
      $notification: 'readonly',
      $modal: 'readonly',
    },
  },
}, {
  // utils 是最底层，禁止引用任何上层模块
  files: ['src/utils/**'],
  rules: upperLayerPatterns(['store', 'composables', 'components', 'views', 'api']),
}, {
  // api 层（含页面内 api.ts）：禁止引用状态层与 UI，保持接口层纯粹
  files: ['src/api/**', 'src/views/*/api.ts'],
  rules: upperLayerPatterns(['store', 'composables', 'components', 'views']),
}, {
  // composables 禁止依赖组件与页面
  files: ['src/composables/**'],
  rules: upperLayerPatterns(['components', 'views']),
}, {
  // store 禁止依赖组件与页面
  files: ['src/store/**'],
  rules: upperLayerPatterns(['components', 'views']),
}, {
  // 页面之间禁止横向引用，跨页复用只能走 components/composables/api 通道（同页相对路径不受限）
  files: ['src/views/**'],
  rules: upperLayerPatterns(['views']),
})
