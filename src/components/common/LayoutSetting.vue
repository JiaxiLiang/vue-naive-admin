<template>
  <div>
    <n-tooltip trigger="hover" placement="left">
      <template #trigger>
        <div id="layout-setting" class="f-c-c rounded-4 bg-primary p-8" @click="modalRef?.open()">
          <i class="i-fe:settings cursor-pointer bg-white text-20" />
        </div>
      </template>
      布局设置
    </n-tooltip>

    <MeModal ref="modalRef" title="布局设置" :show-footer="false" width="600px">
      <n-space justify="space-between">
        <!-- 四种布局的缩略示意用 n-skeleton 骨架块拼出，点击整块即切换全局布局 -->
        <div class="flex-col cursor-pointer justify-center" @click="appStore.setLayout('simple')">
          <div class="flex">
            <n-skeleton :width="20" :height="60" />
            <div class="ml-4">
              <n-skeleton :width="80" :height="60" />
            </div>
          </div>
          <n-button
            class="mt-12"
            size="small"
            :type="appStore.layout === 'simple' ? 'primary' : undefined"
            ghost
          >
            简约
          </n-button>
        </div>
        <div class="flex-col cursor-pointer justify-center" @click="appStore.setLayout('normal')">
          <div class="flex">
            <n-skeleton :width="20" :height="60" />
            <div class="ml-4">
              <n-skeleton :width="80" :height="10" />
              <n-skeleton class="mt-4" :width="80" :height="46" />
            </div>
          </div>
          <n-button
            class="mt-12"
            size="small"
            :type="appStore.layout === 'normal' ? 'primary' : undefined"
            ghost
          >
            通用
          </n-button>
        </div>

        <div class="flex-col cursor-pointer justify-center" @click="appStore.setLayout('full')">
          <div class="flex">
            <n-skeleton :width="20" :height="60" />
            <div class="ml-4">
              <n-skeleton :width="80" :height="6" />
              <n-skeleton class="mt-4" :width="80" :height="4" />
              <n-skeleton class="mt-4" :width="80" :height="42" />
            </div>
          </div>
          <n-button
            class="mt-12"
            size="small"
            :type="appStore.layout === 'full' ? 'primary' : undefined"
            ghost
          >
            全面
          </n-button>
        </div>
        <div class="flex-col cursor-pointer justify-center" @click="appStore.setLayout('empty')">
          <div class="flex">
            <n-skeleton :width="104" :height="60" />
          </div>
          <n-button
            class="mt-12"
            size="small"
            :type="appStore.layout === 'empty' ? 'primary' : undefined"
            ghost
          >
            空白
          </n-button>
        </div>
      </n-space>
      <p class="mt-16 opacity-50">
        注: 此设置仅对未设置layout或者设置成跟随系统的页面有效，菜单设置的layout优先级最高
      </p>
    </MeModal>
  </div>
</template>

<script setup lang="ts">
import { MeModal } from '@/components'
import { useModal } from '@/composables'
import { useAppStore } from '@/store'

// 布局设置入口：齿轮按钮 + 弹窗内四种布局（简约/通用/全面/空白）缩略图，点选即经 appStore 全局生效
// 供页头右侧工具区挂载；当前布局项按钮高亮（type=primary）
const appStore = useAppStore()
const [modalRef] = useModal()
</script>
