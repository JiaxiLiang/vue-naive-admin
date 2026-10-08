<template>
  <div>
    <n-space vertical :size="12">
      <h3>菜单</h3>
      <div class="flex">
        <n-input v-model:value="pattern" placeholder="搜索" clearable />
        <NButton class="ml-12" type="primary" @click="handleAdd()">
          <i class="i-material-symbols:add mr-4 text-14" />
          新增
        </NButton>
      </div>

      <n-tree
        :show-irrelevant-nodes="false"
        :pattern="pattern"
        :data="treeData"
        :selected-keys="currentMenu?.code ? [currentMenu.code] : []"
        :render-prefix="renderPrefix"
        :render-suffix="renderSuffix"
        :on-update:selected-keys="onSelect"
        key-field="code"
        label-field="name"

        block-line default-expand-all
      />
    </n-space>

    <ResAddOrEdit ref="modalRef" :menus="treeData" @refresh="(data) => emit('refresh', data)" />
  </div>
</template>

<script setup lang="ts">
// 菜单树组件：左侧展示菜单（目录/菜单）树，支持搜索过滤、选中后向父页同步当前菜单；
// 树节点尾部可直接新增下级菜单或删除节点，新增/编辑复用 ResAddOrEdit 弹窗
import type { TreeOption } from 'naive-ui'
import type { PermissionItem } from '@/types/models'
import { NButton } from 'naive-ui'
import { withModifiers } from 'vue'
import api from '../api'
import ResAddOrEdit from './ResAddOrEdit.vue'

withDefaults(defineProps<{
  treeData?: PermissionItem[]
  currentMenu?: PermissionItem | null
}>(), {
  treeData: () => [],
  currentMenu: null,
})
const emit = defineEmits<{
  'refresh': [data?: PermissionItem]
  'update:currentMenu': [item: PermissionItem | null]
}>()

const pattern = ref('')

const modalRef = ref<InstanceType<typeof ResAddOrEdit> | null>(null)
// 打开新增菜单弹窗：携带 parentId 时表示在指定节点下新增下级菜单
async function handleAdd(data: Partial<PermissionItem> = {}) {
  modalRef.value?.handleOpen({
    action: 'add',
    title: '新增菜单',
    row: { type: 'MENU', ...data },
    okText: '保存',
  })
}

// 选中节点时上抛实体数据，取消选中时上抛 null；
// meta.node 即传入的原始 PermissionItem（:data 直接绑定实体数组），需收窄类型
function onSelect(keys: Array<string | number>, options: Array<TreeOption | null>, meta: { node: TreeOption | null, action: 'select' | 'unselect' }) {
  emit('update:currentMenu', meta.action === 'select' ? (meta.node as PermissionItem) : null)
}

// 节点前缀渲染菜单图标
function renderPrefix({ option }: { option: TreeOption }) {
  const item = option as PermissionItem
  return h('i', { class: `${item.icon}?mask text-16` })
}

// 节点尾部渲染"新增下级/删除"操作按钮，withModifiers 阻止冒泡避免误触发节点选中
function renderSuffix({ option }: { option: TreeOption }) {
  const menu = option as PermissionItem
  return [
    h(
      NButton,
      {
        text: true,
        type: 'primary',
        title: '新增下级菜单',
        size: 'tiny',
        onClick: withModifiers(() => handleAdd({ parentId: menu.id }), ['stop']),
      },
      { default: () => '新增' },
    ),

    h(
      NButton,
      {
        text: true,
        type: 'error',
        size: 'tiny',
        style: 'margin-left: 12px;',
        onClick: withModifiers(() => handleDelete(menu), ['stop']),
      },
      { default: () => '删除' },
    ),
  ]
}

// 删除菜单：确认后调接口，成功后刷新树并清空选中项
function handleDelete(item: PermissionItem) {
  $dialog.confirm({
    content: `确认删除【${item.name}】？`,
    async confirm() {
      try {
        $message.loading('正在删除', { key: 'deleteMenu' })
        await api.deletePermission(item.id!)
        $message.success('删除成功', { key: 'deleteMenu' })
        emit('refresh')
        emit('update:currentMenu', null)
      }
      catch (error) {
        console.error(error)
        $message.destroy('deleteMenu')
      }
    },
  })
}
</script>
