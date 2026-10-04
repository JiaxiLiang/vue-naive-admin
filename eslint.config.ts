import type { Linter } from 'eslint'
import antfu from '@antfu/eslint-config'

/**
 * 分层依赖方向（C7 机器化）：
 *   utils ← api ← composables ← components ← views ← router/layouts
 * 下层禁止反向 import 上层；store 只能被上层引用（api/views/layouts/composables 可用）。
 * 本文件是 tsconfig.node.json 类型工程的检查对象。
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
  rules: {
    'n/prefer-global/process': 'off',
    'no-undef': 'error',
    'no-fallthrough': 'off',
    'vue/block-order': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    'prefer-promise-reject-errors': 'off',
  },
  languageOptions: {
    globals: {
      h: 'readonly',
      unref: 'readonly',
      provide: 'readonly',
      inject: 'readonly',
      markRaw: 'readonly',
      defineAsyncComponent: 'readonly',
      nextTick: 'readonly',
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
  // 最底层 utils：不得引用 store/composables/components/views/api
  files: ['src/utils/**'],
  rules: upperLayerPatterns(['store', 'composables', 'components', 'views', 'api']),
}, {
  // api 层：不得引用 UI（components/views）、composables 与 store
  files: ['src/api/**', 'src/views/*/api.ts'],
  rules: upperLayerPatterns(['store', 'composables', 'components', 'views']),
}, {
  // composables：不得引用 components/views
  files: ['src/composables/**'],
  rules: upperLayerPatterns(['components', 'views']),
}, {
  // store：不得引用 UI（components/views）
  files: ['src/store/**'],
  rules: upperLayerPatterns(['components', 'views']),
}, {
  // views 之间禁止横向 import（跨页复用只经 components/composables/api 工厂通道；同页相对路径不受限）
  files: ['src/views/**'],
  rules: upperLayerPatterns(['views']),
})
