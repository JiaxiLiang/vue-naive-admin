import type { DataTableColumn } from 'naive-ui'
import type { UserInfo } from '@/types/models'
import { NAvatar, NTag } from 'naive-ui'
import { h } from 'vue'
import { formatDateTime } from '@/utils'

/** 用户行数据：UserInfo 加状态开关的行级 loading 态（前端 UI 字段，不来自后端） */
export type UserRow = UserInfo & { enableLoading?: boolean }

/** hideInExcel 是 MeCrud 导出 Excel 的自定义字段，naive-ui 列类型上没有，交叉类型补上 */
export type UserTableColumn = DataTableColumn<UserRow> & { hideInExcel?: boolean }

/** 性别筛选项（列表查询/展示用 1 男 / 2 女；0 保密仅在个人资料展示层使用，不入筛选项） */
export const GENDERS = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
] satisfies Array<{ label: string, value: 1 | 2 }>

/**
 * 用户列表/角色用户两页共用的基础展示列：头像/用户名/角色/性别/创建时间。
 * 跨页复用走 composables 通道（禁止 view→view 互相 import）；
 * 返回类型显式标注，使各列字面量的 render 参数获得上下文推断，无需再手写 row 类型
 */
export function getBaseUserColumns(): UserTableColumn[] {
  return [
    {
      title: '头像',
      key: 'avatar',
      width: 80,
      render: ({ avatar }) =>
        h(NAvatar, {
          size: 'medium',
          src: avatar,
        }),
    },
    { title: '用户名', key: 'username', width: 150, ellipsis: { tooltip: true } },
    {
      title: '角色',
      key: 'roles',
      width: 200,
      ellipsis: { tooltip: true },
      render: ({ roles }) => {
        if (roles?.length) {
          return roles.map((item, index) =>
            h(
              NTag,
              { type: 'success', style: index > 0 ? 'margin-left: 8px;' : '' },
              { default: () => item.name },
            ),
          )
        }
        return '暂无角色'
      },
    },
    {
      title: '性别',
      key: 'gender',
      width: 80,
      render: ({ gender }) => GENDERS.find(item => gender === item.value)?.label ?? '',
    },
    {
      title: '创建时间',
      key: 'createDate',
      width: 180,
      render: row => h('span', formatDateTime(row.createTime)),
    },
  ]
}
