/**
 * 跨层共享的实体模型（阶段 3 会随 api 层一起补全）
 */

/** 权限/菜单资源实体（当前为占位定义，形状对齐 settings.ts 的 basePermissions 静态数据，阶段 3 与后端接口对齐后完善） */
export interface PermissionItem {
  code: string
  name: string
  type: string
  path?: string
  icon?: string
  order?: number
  enable: boolean
  show: boolean
  children?: PermissionItem[]
}
