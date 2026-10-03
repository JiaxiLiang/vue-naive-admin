# 阶段 6：共享组件（泛型组件是本项目 TS 迁移的最大亮点）

迁移顺序：`MeQueryItem` → `MeModal` → `MeCrud` → common 目录 8 个 → 两个桶文件。
naive-ui 组件在模板里直接用（unplugin 解析），**script 里用到的 naive-ui 类型/组件要显式 import**。

## 6.1 me/crud/QueryItem.vue → lang="ts"

```vue
<script setup lang="ts">
withDefaults(defineProps<{
  /** 搜索项标签 */
  label?: string
  labelWidth?: number
  contentWidth?: number
}>(), {
  label: '',
  labelWidth: 80,
  contentWidth: 220,
})
</script>
```

## 6.2 me/modal/index.vue → lang="ts"

props 全部来自 `src/types/me-components.ts` 的 `ModalOptions`（阶段 4 已定义），用接口复用避免两处维护：

```vue
<script setup lang="ts">
import type { ModalOptions } from '@/types/me-components'
import { initDrag } from './utils'   // utils.js 同步改 utils.ts（拖拽函数参数 el: HTMLElement | null）

const props = withDefaults(defineProps<ModalOptions>(), {
  width: '800px',
  title: '',
  closable: true,
  cancelText: '取消',
  okText: '确定',
  showFooter: true,
  showCancel: true,
  showOk: true,
  modalStyle: () => ({}),      // 原实现 default: () => {} 返回 undefined！
  contentStyle: () => ({}),    // 属于原代码 bug（对象字面量被解析为函数体），返回 undefined
  onOk: () => {},              // 修复成 () => ({}) 会改变行为（多空对象）——保持原样并记 TODO
  onCancel: () => {},
})
```

> **行为保持优先**：原 `default: () => {}` 返回 undefined 是 bug，但修复它属于行为变更。保持原样，进度文档记录。

```ts
const show = ref(false)
const modalOptions = ref<ModalOptions>({})

const okLoading = computed({
  get: () => !!modalOptions.value?.okLoading,
  set(v: boolean) { if (modalOptions.value) modalOptions.value.okLoading = v },
})

// open(options: Partial<ModalOptions> = {}) —— modalOptions.value = { ...props, ...options }
//   props 展开：props 本身是 ModalOptions 形状，成立
// handleOk(data?: any) / handleCancel(data?: any)：res !== false 判断 → res: unknown
// initDrag(...) 的两个 document.querySelectorAll 结果是 Element | undefined（.at(-1)），
//   utils.ts 的 initDrag 第一参数应为 HTMLElement | null | undefined，内部做空判断（原实现已有）
```

`defineExpose` 必须满足阶段 4 的 `MeModalExposed`：

```ts
defineExpose({
  open, close, handleOk, handleCancel, okLoading, options: modalOptions,
} satisfies MeModalExposed)
```

## 6.3 me/crud/index.vue → lang="ts" + 泛型组件（重头戏）

```vue
<script setup lang="ts" generic="T extends Record<string, any>">
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import type { ApiResult } from '@/utils/http'
import type { PageResult } from '@/types/models'
import { NDataTable } from 'naive-ui'
import { utils, writeFile } from 'xlsx'

interface Props {
  /** true 后端分页 / false 前端分页 */
  remote?: boolean
  isPagination?: boolean
  scrollX?: number
  /** 行数据唯一键字段名 */
  rowKey?: string
  /** 列配置：泛型 T 让 render(row) 自动推导 */
  columns: DataTableColumns<T>
  queryItems?: Record<string, any>
  /**
   * 数据源。分页契约：返回 { pageData, total }（分页模式）或 T[]（非分页）
   */
  getData: (params: Record<string, any>) => Promise<ApiResult<PageResult<T> | T[]>>
  /** 搜索栏是否支持展开 */
  expand?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  remote: true,
  isPagination: true,
  scrollX: 1200,
  rowKey: 'id',
  queryItems: () => ({}),
  expand: false,
})

const emit = defineEmits<{
  'update:queryItems': [value: Record<string, any>]
  onChecked: [rowKeys: Array<string | number>]
  onDataChange: [data: T[]]
}>()

const tableData = ref<T[]>([])
const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  prefix({ itemCount }) { return `共 ${itemCount} 条数据` },
})
```

**`handleQuery` 的联合类型收窄**（本组件最典型的类型处理，必须用 `Array.isArray`，行为与原实现完全一致）：

```ts
async function handleQuery() {
  try {
    loading.value = true
    let paginationParams: { pageNo?: number, pageSize?: number } = {}
    if (props.isPagination && props.remote) {
      paginationParams = { pageNo: pagination.page, pageSize: pagination.pageSize }
    }
    const { data } = await props.getData({ ...props.queryItems, ...paginationParams })
    // data: PageResult<T> | T[] | undefined
    const rows = Array.isArray(data) ? data : (data?.pageData ?? [])
    tableData.value = rows
    const total = Array.isArray(data) ? data.length : data?.total
    pagination.itemCount = total
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
```

> 原实现 `pagination.itemCount = data.total ?? data.length`：`Array.isArray` 收窄后语义不变。`pagination.page` 在 PaginationProps 里可选，用 `?? 1` 对齐原默认值。

其余函数类型要点：
- `handleSearch(keepCurrentPage = false)` → `(keepCurrentPage?: boolean) => void`
- `onChecked(rowKeys)` → 模板事件参数类型 `Array<string | number>`（DataTableColumns 有 selection 列时的 rowKeys）
- `handleExport(columns = props.columns, data = tableData.value)` → 列过滤用 `item.title && !item.hideInExcel`；`hideInExcel` 不在 naive-ui 的 column 类型上 → 列类型用 `TableColumns<T> & { hideInExcel?: boolean }` 或导出函数内部 `(item as any).hideInExcel`；行取值 `item[key]` 用 `(row as Record<string, any>)[key as string]`——导出功能类型从宽是务实取舍，记录在进度文档
- `:row-key="(row) => row[rowKey]"` 模板内：`(row: T) => string`，rowKey 是 string 索引，收窄 `(row as Record<string, any>)[props.rowKey]`

`defineExpose`：

```ts
defineExpose({
  handleSearch,
  handleReset,
  handleExport,
})
```

> 泛型组件 (`generic="T"`) 的调用端收益：`<MeCrud :columns="columns" :get-data="api.read" />` 中，`columns` 声明为 `DataTableColumns<User>` 时，T 被推断为 User，`render(row)` 参数自动收窄——阶段 8 的 user 页会实际验证这条链路。

## 6.4 common 目录 8 个组件 → lang="ts"

AppCard / AppPage / CommonPage / LayoutSetting / TheFooter / TheLogo / ThemeSetting / ToggleTheme：
- 机械迁移：`defineProps` 对象语法 → `withDefaults(defineProps<{...}>(), {...})`；有 emit 的用类型化 `defineEmits`
- ThemeSetting/ToggleTheme 涉及 `useAppStore()`（阶段 5 已迁移，类型可推导）
- CommonPage 若引用 `useRouterStore().route`，类型为 `RouteLocationNormalizedLoaded`
- 迁移前每个文件先通读一遍注释与实现，发现 props 隐式 any 的就地补类型

## 6.5 桶文件

`src/components/index.js`、`src/components/me/index.js`、`src/components/common/index.js` → 改 `.ts`（内容不变，re-export 的 SFC 默认导出类型自动可用）。

## 验收

- `pnpm typecheck` 通过（重点看 useCrud/MeModal 的交叉调用是否类型闭环）
- 手测：用户页 + 角色页 + 资源页三页的搜索/重置/展开收起/分页翻页/导出 Excel/弹窗全流程；弹窗拖拽（initDrag）
- 自检泛型链路：user 页 columns 若已声明 `DataTableColumns<User>`（此时尚未，阶段 8 才做）——本阶段先用一个临时变量验证 `<MeCrud generic>` 推导，验证后删除
