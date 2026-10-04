import { fileURLToPath } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // src 里的 ref/computed/useRouter 等由 AutoImport 注入，测试环境保持同一转换
    AutoImport({ imports: ['vue', 'vue-router'], dts: false }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.spec.ts'],
    typecheck: {
      // 仅在 pnpm test:type（vitest --typecheck run）时启用
      enabled: false,
      include: ['tests/**/*.test-d.ts'],
      tsconfig: './tsconfig.typecheck.json',
    },
    coverage: {
      provider: 'v8',
      include: ['src/utils/**', 'src/composables/**'],
      reporter: ['text', 'text-summary'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
})
