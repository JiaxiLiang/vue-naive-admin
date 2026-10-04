// 表格行"状态开关"的通用处理：按行 loading + 调更新接口 + 成功提示与刷新
// user/role 两页的处理逻辑完全一致（api 均为 update），差异只在与列表刷新的对接方式
import type { ApiResult } from '@/utils/http'

/** 可开关行：id 必有；enable 为开关值；enableLoading 为行级 loading 态（前端 UI 字段） */
interface EnableRow {
  id: number
  enable?: boolean
  enableLoading?: boolean
}

export function useEnableRow(
  update: (data: { id: number, enable: boolean }) => Promise<ApiResult<unknown>>,
  onUpdated: () => void,
) {
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
