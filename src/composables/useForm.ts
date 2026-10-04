// 表单管家
import type { FormInst, FormItemRule } from 'naive-ui'
import type { Ref } from 'vue'
import { cloneDeep } from 'lodash-es'

/** naive-ui validate() 的返回值（不是 void，是 warnings 对象的 Promise） */
type ValidationResult = ReturnType<NonNullable<FormInst['validate']>>

/**
 * @returns [formRef(挂到 n-form), formModel(响应式表单数据), validation(触发表单校验), rules(通用校验规则)]
 */
export function useForm<T extends object>(initFormData: T): [Ref<FormInst | null>, Ref<T>, () => ValidationResult | undefined, { required: FormItemRule }] {
  const formRef = ref<FormInst | null>(null)
  // ref() 对泛型 T 返回 Ref<UnwrapRef<T>>，表单数据是普通对象两者等价，此处收口为 Ref<T>
  const formModel = ref(cloneDeep(initFormData)) as Ref<T>
  const rules = {
    required: {
      required: true,
      message: '此为必填项',
      trigger: ['blur', 'change'],
    },
  } satisfies { required: FormItemRule }
  const validation = () => {
    return formRef.value?.validate()
  }
  return [formRef, formModel, validation, rules]
}
