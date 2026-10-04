/**
 * UnoCSS 图标名的模板字面量类型：必须以 `i-` 前缀开头（对应 presetIcons 的 prefix 配置），
 * 如 'i-fe:activity'、'i-simple-icons:juejin'。构建脚本（build/index.ts）与虚拟模块
 * isme:icons 的内容都受它约束，拼错前缀在编译期报错。
 */
export type IconName = `i-${string}`
