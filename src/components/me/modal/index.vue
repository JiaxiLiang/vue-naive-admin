<template>
  <!-- 弃用 n-modal 内置 preset，改由 n-card 自绘头部/底栏，便于定制样式并挂接拖拽 -->
  <n-modal
    v-model:show="show"
    class="modal-box"
    :style="{ width: modalOptions.width, ...modalOptions.modalStyle }"
    :preset="undefined"
    size="huge"
    :bordered="false"
    @after-leave="onAfterLeave"
  >
    <n-card :style="modalOptions.contentStyle" :closable="modalOptions.closable" @close="close()">
      <template #header>
        <header class="modal-header">
          {{ modalOptions.title }}
        </header>
      </template>
      <slot />

      <template #footer>
        <slot name="footer">
          <footer v-if="modalOptions.showFooter" class="flex justify-end">
            <n-button v-if="modalOptions.showCancel" @click="handleCancel()">
              {{ modalOptions.cancelText }}
            </n-button>
            <n-button
              v-if="modalOptions.showOk"
              type="primary"
              :loading="modalOptions.okLoading"
              class="ml-20"
              @click="handleOk()"
            >
              {{ modalOptions.okText }}
            </n-button>
          </footer>
        </slot>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { ModalOptions } from '@/types/me-components'
import { initDrag } from './utils'

// 万能弹窗壳：n-modal + n-card 组合，默认提供「标题 + 取消/确定」底栏，表头可拖拽移动
// 配合 useModal() 使用：页面把 modalRef 挂到本组件上，经 open(options) 按次传入配置；
// onOk/onCancel 返回 false 可阻止关闭，异步请求期间用 okLoading 控制确认按钮 loading
// props 仅作「默认配置」，每次 open 用入参覆盖合并，同一实例可反复开关携带不同内容

// modalStyle/contentStyle 不设默认值：未传时保持 undefined，n-modal/n-card 可直接接受
const props = withDefaults(defineProps<ModalOptions>(), {
  width: '800px',
  title: '',
  closable: true,
  cancelText: '取消',
  okText: '确定',
  showFooter: true,
  showCancel: true,
  showOk: true,
  onOk: () => {},
  onCancel: () => {},
})
const show = ref(false) // 显隐完全由 open/close 驱动，不做成 prop
const modalOptions = ref<ModalOptions>({}) // 本次打开的实际配置（props 默认值 + open 入参）

// 确认按钮 loading 的双向代理：读/写都落在 modalOptions.okLoading 上，
// 对外（defineExpose/useModal）表现为一个可直接赋值的布尔
const okLoading = computed({
  get() {
    return !!modalOptions.value?.okLoading
  },
  set(v: boolean) {
    if (modalOptions.value) {
      modalOptions.value.okLoading = v
    }
  },
})

/** 打开弹窗：合并默认配置与本次入参，渲染完成后给最上层弹窗绑定表头拖拽 */
async function open(options: Partial<ModalOptions> = {}) {
  modalOptions.value = { ...props, ...options }
  show.value = true
  await nextTick()
  initDrag(lastElement('.modal-header'), lastElement('.modal-box'))
}

/** 关闭弹窗 */
function close() {
  show.value = false
}

/**
 * 确定按钮回调：执行 onOk（可透传 data 载荷），返回值不为 false 时自动关闭；
 * onOk 抛错只打印并复位 loading，弹窗保持打开等业务处理
 */
async function handleOk(data?: unknown) {
  if (typeof modalOptions.value.onOk !== 'function') {
    return close()
  }
  try {
    const res = await modalOptions.value.onOk(data)
    if (res !== false)
      close()
  }
  catch (error) {
    console.error(error)
    okLoading.value = false
  }
}

/** 取消按钮回调：逻辑同 handleOk，只是走 onCancel */
async function handleCancel(data?: unknown) {
  if (typeof modalOptions.value.onCancel !== 'function') {
    return close()
  }
  try {
    const res = await modalOptions.value.onCancel(data)

    if (res !== false)
      close()
  }
  catch (error) {
    console.error(error)
    okLoading.value = false
  }
}

/** 退场动画结束后重绑拖拽：document 级监听会被后续 initDrag 覆盖，兜底让剩余最上层弹窗仍可拖 */
async function onAfterLeave() {
  await nextTick()
  initDrag(lastElement('.modal-header'), lastElement('.modal-box'))
}

/** 取文档中匹配选择器的最后一个元素：多弹窗叠层时始终操作最上层的那个 */
function lastElement(selector: string): HTMLElement | undefined {
  const list = document.querySelectorAll<HTMLElement>(selector)
  return list[list.length - 1]
}

// 暴露形状须满足 MeModalExposed（src/types/me-components.ts），useModal 依赖它实现遥控
defineExpose({
  open,
  close,
  handleOk,
  handleCancel,
  okLoading,
  options: modalOptions,
})
</script>
