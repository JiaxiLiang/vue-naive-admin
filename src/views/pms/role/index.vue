<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleAdd()">
        <i class="i-material-symbols:add mr-4 text-18" />
        新增角色
      </NButton>
    </template>

    <MeCrud
      ref="$table"
      v-model:query-items="queryItems"
      :scroll-x="1200"
      :columns="columns"
      :get-data="api.read"
    >
      <MeQueryItem label="角色名" :label-width="50">
        <n-input v-model:value="queryItems.name" type="text" placeholder="请输入角色名" clearable />
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
    <MeModal ref="modalRef" width="520px">
      <n-form
        ref="modalFormRef"
        label-placement="left"
        label-align="left"
        :label-width="80"
        :model="modalForm"
      >
        <n-form-item
          label="角色名"
          path="name"
          :rule="{
            required: true,
            message: '请输入角色名',
            trigger: ['input', 'blur'],
          }"
        >
          <n-input v-model:value="modalForm.name" />
        </n-form-item>
        <n-form-item
          label="角色编码"
          path="code"
          :rule="{
            required: true,
            message: '请输入角色编码',
            trigger: ['input', 'blur'],
          }"
        >
          <n-input v-model:value="modalForm.code" :disabled="modalAction !== 'add'" />
        </n-form-item>
        <n-form-item label="权限" path="permissionIds">
          <n-tree
            key-field="id"
            label-field="name"
            :selectable="false"
            :data="permissionTree"
            :checked-keys="modalForm.permissionIds"
            :on-update:checked-keys="(keys) => (modalForm.permissionIds = keys)"

            checkable check-on-click default-expand-all
            class="cus-scroll max-h-200 w-full"
          />
        </n-form-item>
        <n-form-item label="状态" path="enable">
          <NSwitch v-model:value="modalForm.enable">
            <template #checked>
              启用
            </template>
            <template #unchecked>
              停用
            </template>
          </NSwitch>
        </n-form-item>
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup lang="ts">
// 角色管理页：MeCrud 表格维护角色（新增/编辑/删除/启停），编辑弹窗内用权限树勾选角色拥有的权限；
// 超级管理员（SUPER_ADMIN）行禁用编辑/删除/启停，"分配用户"跳转到 role-user 子页
import type { DataTableColumns } from 'naive-ui'
import type { PermissionItem, Role, RoleQuery } from '@/types/models'
import { NButton, NSwitch } from 'naive-ui'
import { MeCrud, MeModal, MeQueryItem } from '@/components'
import { useCrud, useEnableRow, useRequest, useRouteQuery } from '@/composables'
import api from './api'

defineOptions({ name: 'RoleMgt' })

const router = useRouter()

// 行数据：Role + 状态开关的行级 loading 态（前端 UI 字段，不来自后端）
type RoleRow = Role & { enableLoading?: boolean }
// 弹窗表单：角色字段 + 分配权限时用的 permissionIds
type RoleForm = Partial<RoleRow> & { permissionIds?: number[] }

const $table = ref<{ handleSearch: (keepCurrentPage?: boolean) => void } | null>(null)
// 筛选条件经 useRouteQuery 同步到 URL，刷新/回退不丢
const queryItems = useRouteQuery<RoleQuery>({ name: undefined, enable: undefined })

onMounted(() => {
  $table.value?.handleSearch()
})

const { modalRef, modalFormRef, modalAction, modalForm, handleAdd, handleDelete, handleEdit }
  = useCrud<RoleForm>({
    name: '角色',
    doCreate: api.create,
    doDelete: api.delete,
    doUpdate: api.update,
    initForm: { enable: true },
    refresh: (_, keepCurrentPage) => $table.value?.handleSearch(keepCurrentPage),
  })

const { handleEnable } = useEnableRow(api.update, () => $table.value?.handleSearch())

// 表格列定义：状态列用开关渲染（超管行禁用），操作列提供分配用户/编辑/删除
const columns: DataTableColumns<RoleRow> = [
  { title: '角色名', key: 'name' },
  { title: '角色编码', key: 'code' },
  {
    title: '状态',
    key: 'enable',
    render: row =>
      h(
        NSwitch,
        {
          size: 'small',
          rubberBand: false,
          value: row.enable,
          loading: !!row.enableLoading,
          disabled: row.code === 'SUPER_ADMIN',
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
    render(row) {
      return [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            secondary: true,
            onClick: () =>
              router.push({ path: `/pms/role/user/${row.id}`, query: { roleName: row.name } }),
          },
          {
            default: () => '分配用户',
            icon: () => h('i', { class: 'i-fe:user-plus text-14' }),
          },
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            style: 'margin-left: 12px;',
            disabled: row.code === 'SUPER_ADMIN',
            onClick: () => handleEdit(row),
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
            disabled: row.code === 'SUPER_ADMIN',
            onClick: () => handleDelete(row.id),
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

// 权限树数据走 useRequest 标准件：自带竞态防护与组件卸载自动取消
// data 是请求标准件的事实源，permissionTree 是视图别名；过期/中止的响应到不了 data，也就不会写入树
const permissionTree = ref<PermissionItem[]>([])
const { data: treeData, run: fetchPermissionTree } = useRequest<PermissionItem[]>(
  signal => api.getAllPermissionTree(signal).then(({ data = [] }) => data),
)
watch(treeData, (value) => {
  permissionTree.value = value ?? []
})
fetchPermissionTree()
</script>
