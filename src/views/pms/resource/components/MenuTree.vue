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
        :data="(treeData as any)"
        :selected-keys="([currentMenu?.code] as any)"
        :render-prefix="renderPrefix"
        :render-suffix="renderSuffix"
        :on-update:selected-keys="(onSelect as any)"
        key-field="code"
        label-field="name"

        block-line default-expand-all
      />
    </n-space>

    <ResAddOrEdit ref="modalRef" :menus="treeData" @refresh="(data) => emit('refresh', data)" />
  </div>
</template>

<script setup lang="ts">
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
  'refresh': [data?: any]
  'update:currentMenu': [item: PermissionItem | null]
}>()

const pattern = ref('')

const modalRef = ref<InstanceType<typeof ResAddOrEdit> | null>(null)
async function handleAdd(data: Partial<PermissionItem> = {}) {
  modalRef.value?.handleOpen({
    action: 'add',
    title: '新增菜单',
    row: { type: 'MENU', ...data },
    okText: '保存',
  })
}

// n-tree 的 option 是 TreeOption（字段 unknown），实际数据是 PermissionItem，取字段时断言
function onSelect(keys: Array<string | number>, option: TreeOption | null, meta: { action: string, node: TreeOption | null }) {
  emit('update:currentMenu', meta.action === 'select' ? (meta.node as unknown as PermissionItem) : null)
}

function renderPrefix({ option }: { option: TreeOption }) {
  return h('i', { class: `${option.icon as string}?mask text-16` })
}

function renderSuffix({ option }: { option: TreeOption }) {
  const menu = option as unknown as PermissionItem
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
