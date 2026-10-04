<!-- 封装层次全景（三层蛋糕）：

  第1层  naive-ui           零件库: NDataTable / NModal / NButton...
         ▲ 被包装
  第2层  components/me       半成品: MeCrud(表格+搜索+分页) / MeModal(弹窗壳)
         ▲ 被使用                     MeQueryItem(搜索项排版件)
  第3层  views/pms/*         业务页: 只传配置+接口，一行 <MeCrud/> 完事
   表格+搜索+分页+导出 三位一体
  -->
<template>
  <div class="h-full flex flex-col overflow-hidden">
    <AppCard v-if="$slots.default" bordered bg="#fafafc dark:black" class="mb-30 min-h-60 rounded-4">
      <form class="flex justify-between p-16" @submit.prevent="handleSearch()">
        <n-scrollbar x-scrollable>
          <n-space :wrap="!expand || isExpanded" :size="[32, 16]" class="p-10">
            <slot />
          </n-space>
        </n-scrollbar>
        <div class="flex-shrink-0 p-10">
          <n-button ghost type="primary" @click="handleReset">
            <i class="i-fe:rotate-ccw mr-4" />
            重置
          </n-button>
          <n-button attr-type="submit" class="ml-20" type="primary">
            <i class="i-fe:search mr-4" />
            搜索
          </n-button>

          <template v-if="expand">
            <n-button v-if="!isExpanded" type="primary" text @click="toggleExpand">
              <i class="i-fe:chevrons-down ml-4" />
              展开
            </n-button>
            <n-button v-else text type="primary" @click="toggleExpand">
              <i class="i-fe:chevrons-up ml-4" />
              收起
            </n-button>
          </template>
        </div>
      </form>
    </AppCard>

    <NDataTable
      :remote="remote"
      :loading="loading"
      :scroll-x="scrollX"
      :columns="columns"
      :data="tableData"
      :row-key="getRowKey"
      :pagination="isPagination ? pagination : false"
      flex-height
      class="flex-1"
      @update:checked-row-keys="onChecked"
      @update:page="onPageChange"
    />
  </div>
</template>

<script setup lang="ts" generic="T extends object, Q extends Record<string, unknown> = Record<string, unknown>">
import type { DataTableColumn, DataTableColumns, PaginationProps } from 'naive-ui'
import type { Ref } from 'vue'
import type { PageResult } from '@/types/models'
import type { ApiResult } from '@/utils/http'
import { NDataTable } from 'naive-ui' // 从 naive-ui 导入数据表格组件
import { utils, writeFile } from 'xlsx' // 从 xlsx 导入工具方法和文件写入方法

interface Props {
  /** 分页模式：true 后端分页 / false 前端分页 */
  remote?: boolean
  /** 是否启用分页 */
  isPagination?: boolean
  /** 表格横向滚动宽度 */
  scrollX?: number
  /** 行数据的唯一标识字段名 */
  rowKey?: string
  /** 表格列配置数组：泛型 T 让 render(row) 自动推导 */
  columns: DataTableColumns<T>
  /** 搜索栏的查询条件对象：泛型 Q 由 :get-data 的参数类型反向推断，查询字段名拼错编译期报错 */
  queryItems?: Q
  /**
   * ! 约定接口入参出参
   * 分页模式需约定分页接口入参
   *    @pageSize 分页参数：一页展示多少条，默认10
   *    @pageNo   分页参数：页码，默认1
   * 需约定接口出参
   *    @pageData 分页模式必须,非分页模式如果没有pageData则取上一层data
   *    @total    分页模式必须，非分页模式如果没有total则取上一层data.length
   */
  /** 获取表格数据的接口函数（分页契约：返回 { pageData, total } 或 T[]） */
  getData: (params: Q) => Promise<ApiResult<PageResult<T> | T[]>>
  /** 搜索栏是否支持展开/收起 */
  expand?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  remote: true, // 默认后端分页
  isPagination: true, // 默认启用分页
  scrollX: 1200, // 默认 1200px
  rowKey: 'id', // 默认使用 id 字段
  expand: false,
})

const emit = defineEmits<{
  'update:queryItems': [value: Q]
  'onChecked': [rowKeys: Array<string | number>]
  'onDataChange': [data: T[]]
}>() // 声明组件可触发的事件
const loading = ref(false) // 表格加载状态（ref 为自动导入）
const initQuery = { ...props.queryItems } as Q // 备份初始查询条件，供重置时恢复
// ref() 对泛型 T 会引入 UnwrapRefSimple 包装，表格数据是外部实体数组，统一收口为 Ref<T[]>
const tableData = ref([]) as Ref<T[]>
const pagination = reactive<PaginationProps>({ // 分页配置对象（reactive 为自动导入）
  page: 1, // 当前页码，默认第 1 页
  pageSize: 10, // 每页显示条数，默认 10 条
  prefix({ itemCount }) { // 分页器左侧前缀渲染函数
    return `共 ${itemCount} 条数据` // 显示总数据条数
  },
})

const isExpanded = ref(false) // 搜索项展开状态，默认收起

/** 行键取值：rowKey 字段由调用方指定（默认 id），行键约定为 string | number */
function getRowKey(row: T): string | number {
  return (row as Record<string, unknown>)[props.rowKey ?? 'id'] as string | number
}

function toggleExpand() { // 切换展开/收起的方法
  isExpanded.value = !isExpanded.value // 状态取反
}

async function handleQuery() { // 核心查询函数（异步）
  try { // 尝试执行查询
    loading.value = true // 开启表格加载状态
    let paginationParams: { pageNo?: number, pageSize?: number } = {} // 初始化分页参数为空对象
    if (props.isPagination && props.remote) { // 若启用分页且为后端分页才传分页参数
      paginationParams = { pageNo: pagination.page, pageSize: pagination.pageSize } // 组装页码和每页条数
    }
    // 泛型 Q 经展开会塌缩到约束类型；Q 的契约本身包含分页字段（见各 api 的 Query 类型），结构等价，收口一次
    const { data } = await props.getData({ // 调用传入的接口函数并解构出 data
      ...props.queryItems, // 展开传入所有查询条件
      ...paginationParams, // 展开传入分页参数
    } as Q)
    // 分页契约收窄：data 是 PageResult<T> | T[] | undefined
    tableData.value = Array.isArray(data) ? data : (data?.pageData ?? []) // 有 pageData 就取它，否则直接取 data
    pagination.itemCount = Array.isArray(data) ? data.length : data?.total // 总条数优先取 total，否则取数组长度
    if (pagination.itemCount && !tableData.value.length && (pagination.page ?? 1) > 1) { // 当前页无数据且不在第一页时
      onPageChange((pagination.page ?? 1) - 1) // 自动跳回上一页重新查询
    }
  }
  catch (error) { // 捕获请求异常
    console.error(error) // 控制台打印错误信息
    tableData.value = [] // 清空表格数据
    pagination.itemCount = 0 // 总条数置为 0
  }
  finally { // 无论成功失败都执行
    emit('onDataChange', tableData.value) // 向父组件派发数据变化事件
    loading.value = false // 关闭表格加载状态
  }
}

function handleSearch(keepCurrentPage = false) { // 搜索方法，参数决定是否保留当前页
  if (keepCurrentPage || !props.remote) { // 保留当前页或前端分页时
    handleQuery() // 直接按当前页码查询
  }
  else { // 否则（后端分页的普通搜索）
    onPageChange(1) // 重置回第 1 页再查询
  }
}

async function handleReset() { // 重置查询条件的方法（异步）
  // 先在具体 Record 上逐键置空（泛型 Q 不可直接写索引），再合并初始查询条件
  const cleared: Record<string, unknown> = { ...props.queryItems }
  for (const key in cleared) { // 遍历每个查询字段
    cleared[key] = null // 将字段值全部置为 null
  }
  emit('update:queryItems', { ...cleared, ...initQuery }) // 通知父组件恢复为初始查询条件
  await nextTick() // 等待响应式更新完成（nextTick 为自动导入）
  pagination.page = 1 // 页码重置为第 1 页
  handleQuery() // 重新发起查询
}

function onPageChange(currentPage: number) { // 页码变化回调
  pagination.page = currentPage // 更新当前页码
  if (props.remote) { // 若为后端分页
    handleQuery() // 重新请求该页数据（前端分页则由 naive-ui 自行处理）
  }
}

function onChecked(rowKeys: Array<string | number>) { // 行勾选变化的回调
  // 仅在配置了多选列时向外派发；DataTableColumn 联合中只有 selection 列带 type 字段，in 收窄即可判定
  const hasSelection = props.columns.some(item => 'type' in item && item.type === 'selection')
  if (hasSelection) { // 确认列配置中存在多选列
    emit('onChecked', rowKeys) // 向父组件派发选中行 key 数组
  }
}

// 导出列从宽处理：hideInExcel 是项目自定义字段，naive-ui 的列类型上没有（见 UserTableColumn 交叉类型）
type ExcelColumn = DataTableColumn<T> & { title?: string, key?: string, hideInExcel?: boolean }

function handleExport(columns = props.columns as ExcelColumn[], data: T[] = tableData.value) { // 导出 Excel，可自定义列和数据
  if (!data?.length) // 若没有数据
    return $message.warning('没有数据') // 弹出警告提示并终止导出
  const columnsData = columns.filter(item => !!item.title && !!item.key && !item.hideInExcel) // 过滤有标题、有字段名且不隐藏的列
  const thKeys = columnsData.flatMap(item => (item.key ? [item.key] : [])) // 提取列字段名数组（表头 key）
  const thData = columnsData.flatMap(item => (item.title ? [item.title] : [])) // 提取列标题数组（表头文字）
  const trData = data.map(item => thKeys.map(key => (item as Record<string, unknown>)[key])) // 每行数据按表头顺序映射为二维数组
  const sheet = utils.aoa_to_sheet([thData, ...trData]) // 将二维数组（表头+数据）转为工作表
  const workBook = utils.book_new() // 创建一个新工作簿
  utils.book_append_sheet(workBook, sheet, '数据报表') // 把工作表以"数据报表"命名加入工作簿
  writeFile(workBook, '数据报表.xlsx') // 生成并下载 Excel 文件
}

defineExpose({ // 对外暴露以下方法供父组件调用
  handleSearch, // 搜索方法
  handleReset, // 重置方法
  handleExport, // 导出方法
})
</script>
