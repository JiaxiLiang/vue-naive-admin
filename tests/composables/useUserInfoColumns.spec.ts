import { describe, expect, it } from 'vitest'
import { GENDERS, getBaseUserColumns } from '@/composables/useUserInfoColumns'

describe('getBaseUserColumns 共享用户列', () => {
  const columns = getBaseUserColumns()

  it('输出五列：头像/用户名/角色/性别/创建时间', () => {
    expect(columns.map(c => c.key)).toEqual(['avatar', 'username', 'roles', 'gender', 'createDate'])
  })

  it('render 上下文收窄到 UserRow：性别列按 GENDERS 映射，未匹配回空串', () => {
    const genderColumn = columns.find(c => c.key === 'gender')
    expect(genderColumn).toBeDefined()
    const render = (genderColumn as { render?: (row: { gender?: number }) => string }).render!
    expect(render({ gender: 1 })).toBe('男')
    expect(render({ gender: 2 })).toBe('女')
    expect(render({ gender: 99 })).toBe('')
  })

  it('每次调用返回新数组（调用方可安全追加差异化列）', () => {
    expect(getBaseUserColumns()).not.toBe(columns)
  })
})

describe('gENDERS 常量', () => {
  it('列表筛选项只有男/女（0 保密仅在 profile 页展示层）', () => {
    expect(GENDERS).toEqual([
      { label: '男', value: 1 },
      { label: '女', value: 2 },
    ])
  })
})
