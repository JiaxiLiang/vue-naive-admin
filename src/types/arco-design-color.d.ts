/**
 * @arco-design/color 是无类型声明的 JS 包，这里按实际用到的 API 手写声明
 */
declare module '@arco-design/color' {
  /** 生成调色板；list: true 时返回色板数组 */
  export function generate(color: string, options?: { list?: boolean, dark?: boolean, [key: string]: unknown }): string[]
  /** 十六进制色值转 rgb 字符串 */
  export function getRgbStr(color: string): string
  /** 预设色板：{ red: { primary, ... }, blue: { ... }, ... } */
  export function getPresetColors(): Record<string, { primary: string, [key: string]: string }>
}
