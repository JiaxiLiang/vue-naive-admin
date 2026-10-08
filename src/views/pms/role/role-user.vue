<template>
  <CommonPage back>
    <template #title-suffix>
      <NTag class="ml-12" type="warning">
        {{ route.query.roleName }}
      </NTag>
    </template>
    <template #action>
      <div class="flex items-center">
        <NButton :disabled="!userIds.length" type="error" @click="handleBatchRemove()">
          <i v-if="userIds.length" class="i-material-symbols:delete-outline mr-4 text-18" />
          批量取消授权
        </NButton>
        <NButton
          class="ml-12"
          :disabled="!userIds.length"
          type="primary"
          @click="handleBatchAdd()"
        >
          <i v-if="userIds.length" class="i-line-md:confirm-circle mr-4 text-18" />
          批量授权
        </NButton>
      </div>
    </template>

    <MeCrud
      ref="$table"
      v-model:query-items="queryItems"
      :scroll-x="1200"
      :columns="columns"
      :get-data="api.getAllUsers"
      @on-checked="onChecked"
    >
      <MeQueryItem label="用户名" :label-width="50">
        <n-input
          v-model:value="queryItems.username"
          type="text"
          placeholder="请输入用户名"
          clearable
        />
      </MeQueryItem>

      <MeQueryItem label="性别" :label-width="50">
        <n-select v-model:value="queryItems.gender" clearable :options="GENDERS" />
      </MeQueryItem>

      <MeQueryItem label="状态" :label-width="50">
        <n-select
          v-model:value="queryItems.enable"
          clearable
          :options="[
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ]"
        />
      </MeQueryItem>
    </MeCrud>
  </CommonPage>
</template>

<script setup lang="ts">
// 角色-用户分配页：按路由 roleId 展示全量用户列表，行内/批量对用户执行"授权/取消授权"；
// 操作列按用户是否已拥有该角色渲染不同按钮，勾选行后可批量操作
import type { UserTableColumn } from '@/composables'
import type { UserInfoQuery } from '@/types/models'
import { NButton, NSwitch, NTag } from 'naive-ui'
import { h } from 'vue'
import { MeCrud } from '@/components'
import { GENDERS, getBaseUserColumns } from '@/composables'
import api from './api'

defineOptions({ name: 'RoleUser' })
const route = useRoute()

const $table = ref<{ handleSearch: (keepCurrentPage?: boolean) => void } | null>(null)
const queryItems = ref<UserInfoQuery>({})

onMounted(() => {
  $table.value?.handleSearch()
})

// 列定义：基础列复用共享的 getBaseUserColumns，本页追加多选列、只读状态列与授权操作列
const columns: UserTableColumn[] = [
  { type: 'selection', fixed: 'left' },
  ...getBaseUserColumns(),
  {
    title: '状态',
    key: 'enable',
    width: 100,

    render: row =>
      h(
        NSwitch,
        {
          size: 'small',
          rubberBand: false,
          value: row.enable,
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
    width: 100,
    align: 'right',
    fixed: 'right',
    hideInExcel: true,
    render(row) {
      return row.roles?.some(item => item.id === Number(route.params.roleId))
        ? h(
            NButton,
            {
              size: 'small',
              type: 'error',
              secondary: true,
              onClick: () => handleBatchRemove([row.id]),
            },
            {
              default: () => '取消授权',
              icon: () => h('i', { class: 'i-material-symbols:delete-outline text-14' }),
            },
          )
        : h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              secondary: true,
              onClick: () => handleBatchAdd([row.id]),
            },
            {
              default: () => '授权',
              icon: () => h('i', { class: 'i-line-md:confirm-circle text-14' }),
            },
          )
    },
  },
]

// 表格勾选变化时同步已选用户 id 集合，驱动顶部批量按钮的可用态
const userIds = ref<number[]>([])
function onChecked(rowKeys: Array<string | number>) {
  // 行 key 是 id（number，见 :get-data 数据与默认 rowKey），MeCrud 事件类型是 string | number 的宽联合
  userIds.value = (rowKeys || []) as number[]
}

// 批量授权：默认作用于勾选行，传 ids 时为单行操作；确认后调接口并刷新列表
function handleBatchAdd(ids: number[] = userIds.value) {
  const roleId = route.params.roleId as string
  if (!roleId)
    return $message.error('角色异常，请重新选择角色')
  if (!ids.length)
    return $message.error('请先选择用户')
  $dialog.confirm({
    content: `确认分配【${route.query.roleName}】？`,
    async confirm() {
      await api.addRoleUsers(roleId, { userIds: ids })
      $table.value?.handleSearch()
    },
  })
}
// 批量取消授权：入参与防护逻辑同批量授权，只是调用移除接口
function handleBatchRemove(ids: number[] = userIds.value) {
  const roleId = route.params.roleId as string
  if (!roleId)
    return $message.error('角色异常，请重新选择角色')
  if (!ids.length)
    return $message.error('请先选择用户')
  $dialog.confirm({
    content: `确认取消分配【${route.query.roleName}】？`,
    async confirm() {
      await api.removeRoleUsers(roleId, { userIds: ids })
      $table.value?.handleSearch()
    },
  })
}
</script>
