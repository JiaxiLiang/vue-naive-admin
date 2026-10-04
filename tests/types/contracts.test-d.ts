import type { UserInfo, UserInfoQuery } from '@/types/models'
import type { ApiResult, HttpClient } from '@/utils/http'
import { describe, expectTypeOf, it } from 'vitest'
import { createCrudApi } from '@/api'
import { useForm } from '@/composables/useForm'

/** L2 类型契约测试：改错字段名 / 传错参数形状必须编译失败（vitest --typecheck） */

describe('HttpClient 泛型传递', () => {
  it('get<T> 的 T 传到 ApiResult.data', () => {
    const client = {} as HttpClient
    expectTypeOf(client.get<UserInfo>('/user')).toEqualTypeOf<Promise<ApiResult<UserInfo>>>()
  })

  it('get 无泛型默认 unknown（不引入 any）', () => {
    const client = {} as HttpClient
    expectTypeOf(client.get('/x')).toEqualTypeOf<Promise<ApiResult<unknown>>>()
  })
})

describe('CRUD 工厂类型', () => {
  const crud = createCrudApi<UserInfo, UserInfoQuery>('/user')

  it('read 的参数即页面查询契约 UserInfoQuery', () => {
    expectTypeOf(crud.read).parameter(0).toEqualTypeOf<UserInfoQuery>()
  })

  it('read 的返回是分页联合（MeCrud 经 Array.isArray 收窄）', () => {
    expectTypeOf(crud.read({})).toEqualTypeOf<Promise<ApiResult<import('@/types/models').PageResult<UserInfo> | UserInfo[]>>>()
  })

  it('update 的 data 必带 number id', () => {
    expectTypeOf(crud.update).parameter(0).toEqualTypeOf<Partial<UserInfo> & { id: number }>()
  })
})

describe('useForm 泛型推导', () => {
  it('formModel 的字段类型与入参一致', () => {
    const [, formModel] = useForm<{ name?: string, age?: number }>({ name: 'a' })
    expectTypeOf(formModel.value.name).toEqualTypeOf<string | undefined>()
    expectTypeOf(formModel.value.age).toEqualTypeOf<number | undefined>()
  })
})
