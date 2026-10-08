<template>
  <CommonPage>
    <div class="flex">
      <n-spin size="small" :show="treeLoading">
        <MenuTree
          v-model:current-menu="currentMenu"
          class="w-320 shrink-0"
          :tree-data="treeData"
          @refresh="initData"
        />
      </n-spin>

      <div class="ml-40 w-0 flex-1">
        <template v-if="currentMenu">
          <div class="flex justify-between">
            <h3 class="mb-12">
              {{ currentMenu.name }}
            </h3>
            <NButton size="small" type="primary" @click="handleEdit(currentMenu)">
              <i class="i-material-symbols:edit-outline mr-4 text-14" />
              编辑
            </NButton>
          </div>
          <n-descriptions label-placement="left" bordered :column="2">
            <n-descriptions-item label="编码">
              {{ currentMenu.code }}
            </n-descriptions-item>
            <n-descriptions-item label="名称">
              {{ currentMenu.name }}
            </n-descriptions-item>
            <n-descriptions-item label="路由地址">
              {{ currentMenu.path ?? '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="组件路径">
              {{ currentMenu.component ?? '--' }}
            </n-descriptions-item>
            <n-descriptions-item label="菜单图标">
              <span v-if="currentMenu.icon" class="flex items-center">
                <i :class="`${currentMenu.icon}?mask text-22 mr-8`" />
                <span class="opacity-50">{{ currentMenu.icon }}</span>
              </span>
              <span v-else>无</span>
            </n-descriptions-item>
            <n-descriptions-item label="layout">
              {{ currentMenu.layout || '跟随系统' }}
            </n-descriptions-item>
            <n-descriptions-item label="是否显示">
              {{ currentMenu.show ? '是' : '否' }}
            </n-descriptions-item>
            <n-descriptions-item label="是否启用">
              {{ currentMenu.enable ? '是' : '否' }}
            </n-descriptions-item>
            <n-descriptions-item label="KeepAlive">
              {{ currentMenu.keepAlive ? '是' : '否' }}
            </n-descriptions-item>
            <n-descriptions-item label="排序">
              {{ currentMenu.order ?? '--' }}
            </n-descriptions-item>
          </n-descriptions>

          <div class="mt-32 flex justify-between">
            <h3 class="mb-12">
              按钮
            </h3>
            <NButton size="small" type="primary" @click="handleAddBtn">
              <i class="i-fe:plus mr-4 text-14" />
              新增
            </NButton>
          </div>

          <MeCrud
            ref="$table"
            :columns="btnsColumns"
            :scroll-x="-1"
            :get-data="api.getButtons"
            :query-items="{ parentId: currentMenu.id }"
          />
        </template>
        <n-empty v-else class="h-450 f-c-c" size="large" description="请选择菜单查看详情" />
      </div>
    </div>
    <ResAddOrEdit ref="modalRef" :menus="treeData" @refresh="initData" />
  </CommonPage>
</template>

<script setup lang="ts">
// 资源（菜单/按钮权限）管理页：左侧 MenuTree 选择菜单，右侧展示菜单详情及其下的按钮权限点列表；
// 支持菜单与按钮的新增、编辑、删除，以及按钮的启用/停用切换
import type { DataTableColumns } from 'naive-ui'
import type { PermissionItem } from '@/types/models'
import { NButton, NSwitch } from 'naive-ui'
import { MeCrud } from '@/components'
import api from './api'
import MenuTree from './components/MenuTree.vue'
import ResAddOrEdit from './components/ResAddOrEdit.vue'

// 按钮行数据：PermissionItem + 状态开关的行级 loading 态（前端 UI 字段，不来自后端）
type BtnRow = PermissionItem & { enableLoading?: boolean }

const treeData = ref<PermissionItem[]>([])
const treeLoading = ref(false)
const $table = ref<{ handleSearch: (keepCurrentPage?: boolean) => void } | null>(null)
const currentMenu = ref<PermissionItem | null>(null)
// 刷新入口：树节点变更时只重查菜单树并回显选中项；按钮节点变更时仅刷新按钮表格
async function initData(data?: PermissionItem) {
  if (data?.type === 'BUTTON') {
    $table.value!.handleSearch()
    return
  }
  treeLoading.value = true
  const res = await api.getMenuTree()
  treeData.value = res?.data || []
  treeLoading.value = false

  if (data)
    currentMenu.value = data
}
initData()

const modalRef = ref<InstanceType<typeof ResAddOrEdit> | null>(null)
// 打开编辑菜单弹窗，回填当前菜单数据
function handleEdit(item: PermissionItem) {
  modalRef.value?.handleOpen({
    action: 'edit',
    title: `编辑菜单 - ${item.name}`,
    row: item,
    okText: '保存',
  })
}

// 按钮权限点表格列定义：状态列用开关渲染启停切换，操作列提供编辑/删除
const btnsColumns: DataTableColumns<BtnRow> = [
  { title: '名称', key: 'name' },
  { title: '编码', key: 'code' },
  {
    title: '状态',
    key: 'enable',
    render: (row: BtnRow) =>
      h(
        NSwitch,
        {
          size: 'small',
          rubberBand: false,
          value: row.enable,
          loading: !!row.enableLoading,
          onUpdateValue: () => handleEnable(row),
        },
        {
          checked: () => '启用',
          unchecked: () => '停用',
        },
      ),
  },
  {
    title: '操作',
    key: 'actions',
    width: 320,
    align: 'right',
    fixed: 'right',
    render(row: BtnRow) {
      return [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            style: 'margin-left: 12px;',
            onClick: () => handleEditBtn(row),
          },
          {
            default: () => '编辑',
            icon: () => h('i', { class: 'i-material-symbols:edit-outline text-14' }),
          },
        ),

        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            style: 'margin-left: 12px;',
            onClick: () => handleDeleteBtn(row.id!),
          },
          {
            default: () => '删除',
            icon: () => h('i', { class: 'i-material-symbols:delete-outline text-14' }),
          },
        ),
      ]
    },
  },
]

// 选中菜单变化后，等 MeCrud 拿到新的 parentId 再触发按钮列表查询
watch(
  () => currentMenu.value,
  async (v) => {
    await nextTick()
    if (v)
      $table.value!.handleSearch()
  },
)

// 新增按钮：parentId 挂在当前选中菜单下
function handleAddBtn() {
  modalRef.value?.handleOpen({
    action: 'add',
    title: '新增按钮',
    row: { type: 'BUTTON', parentId: currentMenu.value?.id ?? null },
    okText: '保存',
  })
}

// 打开编辑按钮弹窗
function handleEditBtn(row: BtnRow) {
  modalRef.value?.handleOpen({
    action: 'edit',
    title: `编辑按钮 - ${row.name}`,
    row,
    okText: '保存',
  })
}

// 删除按钮权限点：确认后调接口并刷新按钮表格
function handleDeleteBtn(id: number | string) {
  const d = $dialog.warning({
    content: '确定删除？',
    title: '提示',
    positiveText: '确定',
    negativeText: '取消',
    async onPositiveClick() {
      try {
        d.loading = true
        await api.deletePermission(id)
        $message.success('删除成功')
        $table.value!.handleSearch()
        d.loading = false
      }
      catch (error) {
        console.error(error)
        d.loading = false
      }
    },
  })
}

// 切换按钮启用/停用：行级 loading 防止重复点击，失败不翻转状态
async function handleEnable(item: BtnRow) {
  try {
    item.enableLoading = true
    await api.savePermission(item.id!, {
      enable: !item.enable,
    })
    $message.success('操作成功')
    $table.value?.handleSearch()
    item.enableLoading = false
  }
  catch (error) {
    console.error(error)
    item.enableLoading = false
  }
}
</script>
