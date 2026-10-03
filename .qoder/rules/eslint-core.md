---
trigger: always_on
---

# ESLint 核心代码范式（antfu）

1. 无分号；单引号；2 空格缩进；多行对象/数组/导入带尾逗号。
2. vue/vue-router/Naive UI 已自动导入，严禁显式 import；全局 `$message`/`$dialog`/`$modal`/`Message` 直接用。
3. `else`/`catch` 独占一行，不与 `}` 同行；箭头函数单参数不加括号：`data => api.post(data)`。
4. import 置顶分组：node → 第三方 → `@/` → 相对路径。
5. 业务组件 `Me` 前缀；组合式 `useXxx` 具名导出；页面接口写在 `api.js`：默认导出对象、箭头函数直接包裹 request、无 await。
6. 冲突时以 `pnpm lint:fix` 结果为准。
