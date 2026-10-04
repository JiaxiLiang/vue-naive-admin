import type { FormInst } from 'naive-ui'
import { describe, expect, it, vi } from 'vitest'
import { useForm } from '@/composables/useForm'

describe('useForm 表单管家', () => {
  it('formModel 初始化为深拷贝（后续改动不影响初始对象）', () => {
    const init = { name: 'a', nested: { x: 1 } }
    const [, formModel] = useForm(init)
    formModel.value.nested.x = 99
    expect(init.nested.x).toBe(1)
  })

  it('未挂载 formRef 时 validation 返回 undefined', () => {
    const [formRef, , validation] = useForm({})
    expect(formRef.value).toBeNull()
    expect(validation()).toBeUndefined()
  })

  it('挂载 formRef 后 validation 调用 naive 的 validate', () => {
    const [formRef, , validation] = useForm({})
    const validate = vi.fn(() => Promise.resolve(true))
    formRef.value = { validate } as unknown as FormInst
    validation()
    expect(validate).toHaveBeenCalledTimes(1)
  })

  it('提供通用 required 校验规则', () => {
    const [, , , rules] = useForm({})
    expect(rules.required.required).toBe(true)
    expect(rules.required.message).toBe('此为必填项')
  })
})
