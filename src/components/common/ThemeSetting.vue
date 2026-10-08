<template>
  <div class="f-c-c">
    <n-tooltip trigger="hover" placement="bottom">
      <template #trigger>
        <!-- render-label 返回空串：隐藏取色器自带的色值文字，仅展示色块 -->
        <n-color-picker
          id="theme-setting"
          class="h-32 w-32"
          :value="appStore.primaryColor"
          :swatches="primaryColors"
          :on-update:value="(v: string) => appStore.setPrimaryColor(v)"
          :render-label="() => ''"
        />
      </template>
      设置主题色
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import { getPresetColors } from '@arco-design/color'
import { useAppStore } from '@/store'

// 头部工具栏的主题色选择器：取色/选预设色经 appStore.setPrimaryColor 全站生效
const appStore = useAppStore()

// 预设色板取自 arco 色彩算法（返回类型已在 arco-design-color.d.ts 补声明），只取每组的 primary 主色
const primaryColors = Object.entries(getPresetColors()).map(([, value]) => value.primary)
</script>
