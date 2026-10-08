import type { FormInst, FormItemRule } from 'naive-ui'
import type { Ref } from 'vue'
import { cloneDeep } from 'lodash-es'

/** naive-ui validate() 的返回值（不是 void，是 warnings 对象的 Promise） */
type ValidationResult = ReturnType<NonNullable<FormInst['validate']>>

/**
 * 表单管家：统一产出弹窗表单三件套与通用必填规则，页面不再各自声明 formRef/formModel 样板。
 * @param initFormData 表单初始数据（内部深拷贝持有，外部对象后续变动不污染表单）
 * @returns [formRef(挂到 n-form), formModel(响应式表单数据), validation(触发表单校验), rules(通用校验规则)]
 */
export function useForm<T extends object>(initFormData: T): [Ref<FormInst | null>, Ref<T>, () => ValidationResult | undefined, { required: FormItemRule }] {
  const formRef = ref<FormInst | null>(null)
  // ref() 对泛型 T 返回 Ref<UnwrapRef<T>>；表单数据是普通对象时两者等价，此处收口为 Ref<T>
  const formModel = ref(cloneDeep(initFormData)) as Ref<T>
  /** 通用必填规则：blur/change 双触发，同时覆盖输入框与选择器两类控件 */
  const rules = {
    required: {
      required: true,
      message: '此为必填项',
      trigger: ['blur', 'change'],
    },
  } satisfies { required: FormItemRule }
  /** 触发整表校验；formRef 未挂载时为 undefined，校验失败由调用方按 naive 约定处理 */
  const validation = () => {
    return formRef.value?.validate()
  }
  return [formRef, formModel, validation, rules]
}
