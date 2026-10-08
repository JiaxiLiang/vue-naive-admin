// @arco-design/color 未提供类型声明，这里按项目实际用到的 API 手写补充
declare module '@arco-design/color' {
  /** 由基础色生成调色板；list 为 true 时返回整组色阶数组 */
  export function generate(color: string, options?: { list?: boolean, dark?: boolean, [key: string]: unknown }): string[]
  /** 十六进制色值转 rgb 字符串（写入主题 CSS 变量供 rgba() 消费） */
  export function getRgbStr(color: string): string
  /** arco 预设色板，形如 { red: { primary, ... }, blue: { ... } } */
  export function getPresetColors(): Record<string, { primary: string, [key: string]: string }>
}
