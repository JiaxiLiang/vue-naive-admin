<template>
  <div class="h-full flex flex-col overflow-hidden">
    <AppCard v-if="$slots.default" bordered bg="#fafafc dark:black" class="mb-30 min-h-60">
      <!-- 包一层 form：搜索输入框内按回车即可触发搜索 -->
      <form class="flex justify-between p-16" @submit.prevent="handleSearch()">
        <n-scrollbar x-scrollable>
          <!-- 可展开的搜索栏在收起态强制单行（超出部分横向滚动），展开后允许换行铺开 -->
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
import { NDataTable } from 'naive-ui'
import { utils, writeFile } from 'xlsx'

// 通用 CRUD 表格：搜索栏（默认插槽）+ 数据表格 + 分页 + Excel 导出，四合一的「半成品」组件
// 分工：本组件只管渲染与交互，查询条件由页面持有并经 v-model:queryItems 双向绑定
// 与 useCrud 配合：useCrud（useModal+useForm 封装）负责新增/编辑/删除等弹窗动作，
// 其 refresh 回调经本组件 ref 调 handleSearch 刷新表格；勾选行 key 经 onChecked 交给页面做批量删除
// 泛型 T 为行数据类型；Q 为查询条件类型，由 :get-data 参数反向推断，字段拼错编译期报错

interface Props {
  /** true 后端分页（翻页重新请求）/ false 数据全量在前端，由表格本地分页 */
  remote?: boolean
  /** 是否启用分页 */
  isPagination?: boolean
  /** 表格横向滚动宽度 */
  scrollX?: number
  /** 行数据唯一标识字段名 */
  rowKey?: string
  /** 列配置：泛型 T 让 render(row) 自动推导 */
  columns: DataTableColumns<T>
  /** 查询条件对象，经 v-model:queryItems 与父组件双向绑定 */
  queryItems?: Q
  /**
   * 拉取表格数据的接口函数。分页契约：入参由组件注入 pageNo/pageSize；
   * 出参为 { pageData, total }（非分页模式直接返回 T[]，total 缺省时取数组长度）
   */
  getData: (params: Q) => Promise<ApiResult<PageResult<T> | T[]>>
  /** 搜索栏是否显示展开/收起按钮 */
  expand?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  remote: true,
  isPagination: true,
  scrollX: 1200,
  rowKey: 'id',
  expand: false,
})

// onChecked：勾选行 key 数组变化；onDataChange：每次查询后把最新表格数据回传页面
const emit = defineEmits<{
  'update:queryItems': [value: Q]
  'onChecked': [rowKeys: Array<string | number>]
  'onDataChange': [data: T[]]
}>()
const loading = ref(false)
const initQuery = { ...props.queryItems } as Q // 查询条件快照，重置时按它恢复
// ref() 对泛型 T 会引入 UnwrapRefSimple 包装，表格数据是外部实体数组，显式收口为 Ref<T[]>
const tableData = ref([]) as Ref<T[]>
const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  prefix({ itemCount }) {
    return `共 ${itemCount} 条数据`
  },
})

const isExpanded = ref(false)

/** 行键取值：按调用方指定的 rowKey 字段（默认 id）读取，约定为 string | number */
function getRowKey(row: T): string | number {
  return (row as Record<string, unknown>)[props.rowKey ?? 'id'] as string | number
}

/** 展开/收起搜索栏 */
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

/** 拉取表格数据：组装查询条件与分页参数请求接口，并维护 loading、总条数与空页回退 */
async function handleQuery() {
  try {
    loading.value = true
    let paginationParams: { pageNo?: number, pageSize?: number } = {}
    if (props.isPagination && props.remote) {
      paginationParams = { pageNo: pagination.page, pageSize: pagination.pageSize }
    }
    // Q 经展开会塌缩到约束类型；Q 的契约本身含分页字段（见各 api 的 Query 类型），结构等价，收口一次
    const { data } = await props.getData({
      ...props.queryItems,
      ...paginationParams,
    } as Q)
    // 出参两种形态：T[] 直接用；PageResult 拆取 pageData / total
    tableData.value = Array.isArray(data) ? data : (data?.pageData ?? [])
    pagination.itemCount = Array.isArray(data) ? data.length : data?.total
    // 删除/过滤后当前页可能变空：自动回退上一页重查，避免停留在空白页
    if (pagination.itemCount && !tableData.value.length && (pagination.page ?? 1) > 1) {
      onPageChange((pagination.page ?? 1) - 1)
    }
  }
  catch (error) {
    console.error(error)
    tableData.value = []
    pagination.itemCount = 0
  }
  finally {
    emit('onDataChange', tableData.value)
    loading.value = false
  }
}

/**
 * 发起搜索（搜索按钮与页面 ref 共用）
 * @param keepCurrentPage true 按当前页码重查；后端分页的常规搜索一律回第 1 页
 */
function handleSearch(keepCurrentPage = false) {
  if (keepCurrentPage || !props.remote) {
    handleQuery()
  }
  else {
    onPageChange(1)
  }
}

/** 重置：查询条件逐键置空后恢复初始快照，回第 1 页重新查询 */
async function handleReset() {
  // 泛型 Q 不可直接写索引，先落到具体 Record 上逐键置空
  const cleared: Record<string, unknown> = { ...props.queryItems }
  for (const key in cleared) {
    cleared[key] = null
  }
  emit('update:queryItems', { ...cleared, ...initQuery })
  // 等父组件侧 queryItems 更新落地后再查询，避免带上旧值
  await nextTick()
  pagination.page = 1
  handleQuery()
}

/** 翻页：后端分页重新请求该页；前端分页由 naive-ui 本地完成，这里只更新页码 */
function onPageChange(currentPage: number) {
  pagination.page = currentPage
  if (props.remote) {
    handleQuery()
  }
}

/** 勾选变化：仅当列配置里真的有多选列时才向外派发，无勾选列的页面不会误触发 */
function onChecked(rowKeys: Array<string | number>) {
  // DataTableColumn 联合中只有 selection 列带 type 字段，用 in 收窄判定
  const hasSelection = props.columns.some(item => 'type' in item && item.type === 'selection')
  if (hasSelection) {
    emit('onChecked', rowKeys)
  }
}

// hideInExcel 是项目自定义的列扩展字段，naive-ui 的列类型上没有，交叉类型补上
type ExcelColumn = DataTableColumn<T> & { title?: string, key?: string, hideInExcel?: boolean }

/** 导出当前表格为 Excel：只导出有 title+key 且未被 hideInExcel 标记的列 */
function handleExport(columns = props.columns as ExcelColumn[], data: T[] = tableData.value) {
  if (!data?.length)
    return $message.warning('没有数据')
  const columnsData = columns.filter(item => !!item.title && !!item.key && !item.hideInExcel)
  const thKeys = columnsData.flatMap(item => (item.key ? [item.key] : []))
  const thData = columnsData.flatMap(item => (item.title ? [item.title] : []))
  // 行数据按表头字段顺序映射成二维数组，连同表头写入工作表后下载
  const trData = data.map(item => thKeys.map(key => (item as Record<string, unknown>)[key]))
  const sheet = utils.aoa_to_sheet([thData, ...trData])
  const workBook = utils.book_new()
  utils.book_append_sheet(workBook, sheet, '数据报表')
  writeFile(workBook, '数据报表.xlsx')
}

// 暴露给页面 ref：useCrud 的 refresh 回调即调用 handleSearch，工具栏导出按钮调 handleExport
defineExpose({
  handleSearch,
  handleReset,
  handleExport,
})
</script>
