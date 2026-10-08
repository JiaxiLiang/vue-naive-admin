import type { ApiResult } from '@/utils/http'

/** 可开关行：id 必有；enable 为开关值；enableLoading 为行级 loading 态（前端 UI 字段，不来自后端） */
interface EnableRow {
  id: number
  enable?: boolean
  enableLoading?: boolean
}

/**
 * 表格行"状态开关"标准件：按行 loading + 翻转 enable 调更新接口 + 成功提示并触发刷新。
 * user/role 两页处理完全一致（均打 update 接口），差异只在列表刷新的对接方式，经 onUpdated 注入
 * @param update 状态更新接口
 * @param onUpdated 更新成功后的列表刷新回调
 */
export function useEnableRow(
  update: (data: { id: number, enable: boolean }) => Promise<ApiResult<unknown>>,
  onUpdated: () => void,
) {
  /** 切换单行启用状态：失败时只复位行 loading，错误提示由 http 层统一弹出 */
  async function handleEnable(row: EnableRow) {
    row.enableLoading = true
    try {
      await update({ id: row.id, enable: !row.enable })
      row.enableLoading = false
      $message.success('操作成功')
      onUpdated()
    }
    catch (error) {
      console.error(error)
      row.enableLoading = false
    }
  }
  return { handleEnable }
}
