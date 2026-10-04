<!-- 可拖拽万能弹窗壳 -->
<template>
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

      <!-- 底部按钮 -->
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

/** modalStyle/contentStyle 不设默认值：未传时保持 undefined，n-modal/n-card 的 style 接受 undefined */
const props = withDefaults(defineProps<ModalOptions>(), {
  width: '800px',
  title: '',
  closable: true,
  cancelText: '取消',
  okText: '确定',
  showFooter: true,
  showCancel: true,
  showOk: true,
  onOk: () => {}, // Function 类型 prop 的默认值是函数本身（Vue 不调用），与原实现一致
  onCancel: () => {},
})
// 声明一个show变量，用于控制模态框的显示与隐藏
const show = ref(false)
// 声明一个modalOptions变量，用于存储模态框的配置信息
const modalOptions = ref<ModalOptions>({})

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

// 打开模态框
async function open(options: Partial<ModalOptions> = {}) {
  // 将props和options合并赋值给modalOptions
  modalOptions.value = { ...props, ...options }

  // 将show的值设置为true
  show.value = true
  await nextTick()
  initDrag(lastElement('.modal-header'), lastElement('.modal-box'))
}

// 定义一个close函数，用于关闭模态框
function close() {
  show.value = false
}

// 定义一个handleOk函数，用于处理模态框确定操作
async function handleOk(data?: unknown) {
  // 如果modalOptions中没有onOk函数，则直接关闭模态框
  if (typeof modalOptions.value.onOk !== 'function') {
    return close()
  }
  try {
    // 调用onOk函数，传入data参数
    const res = await modalOptions.value.onOk(data)
    // 如果onOk函数的返回值不为false，则关闭模态框
    if (res !== false)
      close()
  }
  catch (error) {
    console.error(error)
    okLoading.value = false
  }
}

// 定义一个handleCancel函数，用于处理模态框取消操作
async function handleCancel(data?: unknown) {
  // 如果modalOptions中没有onCancel函数，则直接关闭模态框
  if (typeof modalOptions.value.onCancel !== 'function') {
    return close()
  }
  try {
    // 调用onCancel函数，传入data参数
    const res = await modalOptions.value.onCancel(data)

    // 如果onCancel函数的返回值不为false，则关闭模态框
    if (res !== false)
      close()
  }
  catch (error) {
    console.error(error)
    okLoading.value = false
  }
}

async function onAfterLeave() {
  await nextTick()
  initDrag(lastElement('.modal-header'), lastElement('.modal-box'))
}

/** 取当前文档中最后一批匹配元素的最后一个（弹窗叠层时操作最上层的那个） */
function lastElement(selector: string): HTMLElement | undefined {
  const list = document.querySelectorAll<HTMLElement>(selector)
  return list[list.length - 1]
}

// 定义一个defineExpose函数，用于暴露open、close、handleOk、handleCancel函数
// 暴露形状必须满足 src/types/me-components.ts 的 MeModalExposed（ref 解包后 options 即 ModalOptions）
defineExpose({
  open,
  close,
  handleOk,
  handleCancel,
  okLoading,
  options: modalOptions,
})
</script>
