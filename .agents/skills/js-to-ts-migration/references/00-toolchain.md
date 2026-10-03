# 阶段 0：工具链与类型地基

目标：让项目能跑 `vue-tsc`，并为后续所有阶段铺好类型基础设施。本阶段**不改任何业务代码**。

## 0.1 安装依赖

```bash
pnpm add -D typescript vue-tsc
```

不需要额外装 `@types/node`（vite.config 不在 typecheck 范围内）。

## 0.2 新建 tsconfig.json（替代 jsconfig.json）

```jsonc
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "strict": false,            // 渐进策略：阶段 0 关闭，阶段 9 开启
    "allowJs": true,            // 渐进策略：迁移期允许 .js 与 .ts 共存，阶段 9 关闭
    "checkJs": false,           // 不检查未迁移的 JS 文件
    "jsx": "preserve",
    "noEmit": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "useDefineForClassFields": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "~/*": ["./*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.vue",
    "auto-imports.d.ts",
    "components.d.ts"
  ],
  "exclude": ["node_modules", "dist"]
}
```

注意：此时**先不删** `jsconfig.json`（阶段 9 才删），两者短期共存没有冲突。

## 0.3 vite.config.js：开启自动导入的类型生成

两处修改（这是本项目独有的坑——原配置都是 `dts: false`）：

```js
AutoImport({
  imports: ['vue', 'vue-router'],
  dts: true,                  // 原: false → 生成根目录 auto-imports.d.ts
}),
Components({
  resolvers: [NaiveUiResolver()],
  dts: true,                  // 原: false → 生成根目录 components.d.ts
}),
```

生成后运行一次 `pnpm dev` 让两个 d.ts 实际落盘，然后**把它们提交进 git**（否则 fresh clone 后 typecheck 缺失这两个文件会大量报错）。

## 0.4 新建 src/types/ 声明文件（本阶段 4 个）

### src/types/env.d.ts —— 环境变量类型

依据 `.env` / `.env.development` / `.env.production` 中的实际变量：

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 页面标题 */
  readonly VITE_TITLE: string
  /** 是否使用 Hash 路由：'true' | 'false'（.env 里都是字符串） */
  readonly VITE_USE_HASH: string
  /** 资源公共路径 */
  readonly VITE_PUBLIC_PATH: string
  /** axios 基础路径（走 proxy 或直连 mock） */
  readonly VITE_AXIOS_BASE_URL: string
  /** 开发代理目标 */
  readonly VITE_PROXY_TARGET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### src/types/global.d.ts —— window 全局对象声明

`$message` / `$dialog` 是 `naiveTools.js` 包装过的（不是 naive-ui 原生 API），先在这里定义包装类型，阶段 2 的 `naiveTools.ts` 复用它们：

```ts
import type {
  DialogApiInjection,
  DialogOptions,
  LoadingBarApi,
  MessageOptions,
  MessageReactive,
  NotificationApi,
} from 'naive-ui'

/** setupMessage 包装后的 message（比原生多 key 复用/延时销毁能力） */
export interface WrappedMessage {
  loading: (content: string, option?: MessageOptions) => MessageReactive | undefined
  success: (content: string | (() => VNodeChild) , option?: MessageOptions) => MessageReactive | undefined
  error: (content: string, option?: MessageOptions) => MessageReactive | undefined
  info: (content: string, option?: MessageOptions) => MessageReactive | undefined
  warning: (content: string, option?: MessageOptions) => MessageReactive | undefined
}

/** setupDialog 扩展后的 dialog：confirm 支持简化版 confirm/cancel 回调 */
export type WrappedDialog = DialogApiInjection & {
  confirm: (option: Partial<DialogOptions> & {
    confirm?: () => void
    cancel?: () => void
  }) => MessageReactive | undefined
}

declare global {
  interface Window {
    $message: WrappedMessage
    $dialog: WrappedDialog
    $notification: NotificationApi
    $loadingBar: LoadingBarApi
  }
  // 裸标识符写法（代码里大量存在 $message.success(...) 而不是 window.$message）
  // eslint-disable-next-line ts/no-unnecessary-condition
  var $message: WrappedMessage
  var $dialog: WrappedDialog
  var $notification: NotificationApi
  var $loadingBar: LoadingBarApi
}

export {}
```

注意两点：
- `VNodeChild` 需要从 vue `import type`。
- 裸用法声明用 `var`（TS 全局常量的标准写法），不要用 `const`（在 d.ts 的 `declare global` 里 const 不产生 window 属性语义）。

### src/types/virtual-modules.d.ts —— 自定义虚拟模块

`build/plugin-isme/icons.js` 和 `page-pathes.js` 注入的两个虚拟模块。输出形状是 `JSON.stringify(数组)`，具体元素结构以 `build/plugin-isme/index.js` 中 `getIcons()` / `getPagePathes()` 的返回值为准（执行时先读这两个函数确认）：

```ts
declare module 'isme:icons' {
  /** getIcons() 的返回值，形状以 build/plugin-isme/index.js 为准 */
  const icons: Array<{ body: string, prefix: string, name: string }>
  export default icons
}

declare module 'isme:page-pathes' {
  const pagePathes: Array<{ path: string, name: string }>
  export default pagePathes
}
```

### src/types/.gitignore 配套

`src/types/` 下的 `auto-imports.d.ts`、`components.d.ts` 在根目录（不在 src/types），无需处理。

## 0.5 package.json 加 typecheck 脚本

```json
"scripts": {
  "typecheck": "vue-tsc --noEmit"
}
```

## 0.6 eslint 确认

@antfu/eslint-config 检测到 `typescript` 依赖后自动启用 TS 规则，无需改 `eslint.config.js`。验证方式：对任意一个 `.ts` 文件跑 `pnpm lint:fix` 不报 "parsing error"。

## 验收

- `pnpm typecheck` 通过（此时项目里没有 .ts 业务文件，应零输出）
- `pnpm dev` 启动正常，`auto-imports.d.ts`、`components.d.ts` 已生成
- `pnpm build` 通过
- 手测：登录一次即可（本阶段理论上零行为变化）
