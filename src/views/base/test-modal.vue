<template>
  <CommonPage show-footer>
    <n-button type="primary" @click="openModal1">
      打开第一个弹个窗
    </n-button>
    <MeModal ref="$modal1">
      <n-input v-model:value="text" />
    </MeModal>
    <MeModal ref="$modal2" title="上一个弹窗提交的内容">
      <h2>{{ text }}</h2>
    </MeModal>
  </CommonPage>
</template>

<script setup lang="ts">
// 弹窗链式演示页：useModal 打开第一个弹窗，提交后继续弹出第二个弹窗，展示多级弹窗的开关与 okLoading 控制
import { MeModal } from '@/components'
import { useModal } from '@/composables'
import { sleep } from '@/utils'

const text = ref('')
const [$modal1, okLoading1] = useModal()
// 打开第一个弹窗：onOk 返回 false 表示不自动关闭，由提交流程自行控制
function openModal1() {
  $modal1.value?.open({
    title: '第一个弹窗',
    width: '600px',
    okText: '再弹个窗',
    cancelText: '关闭',
    async onOk() {
      if (!text.value) {
        $message.warning('请输入内容')
        return false // 校验失败，阻止弹窗关闭
      }
      okLoading1.value = true
      $message.loading('正在提交...', { key: 'modal1' })
      await sleep(1000)
      okLoading1.value = false
      $message.success('提交成功', { key: 'modal1' })
      openModal2()
      return false // 提交后弹出下一级弹窗，本弹窗保持打开
    },
    onCancel: (message: unknown) => {
      $message.info(typeof message === 'string' ? message : '已取消')
    },
  })
}

const [$modal2, okLoading2] = useModal()
// 打开第二个弹窗：确认时连同第一个弹窗一并关闭
function openModal2() {
  $modal2.value?.open({
    cancelText: '关闭当前',
    okText: '关闭所有弹窗',
    width: '400px',
    async onOk() {
      okLoading2.value = true
      $message.loading('正在关闭...', { key: 'modal2' })
      await sleep(1000)
      okLoading2.value = false

      // 关闭自身的同时把 modal1 也关掉，实现多级弹窗整体收起
      $modal1.value?.close()
      $message.success('已关闭', { key: 'modal2' })
    },
  })
}
</script>
