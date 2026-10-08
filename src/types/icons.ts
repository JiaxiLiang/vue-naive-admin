/**
 * 约束项目全部合法图标名的模板字面量类型：i- 前缀与 presetIcons 的 prefix 配置对应，
 * 构建脚本与虚拟模块产出的图标名均受此约束，拼错前缀在编译期即报错
 */
export type IconName = `i-${string}`
