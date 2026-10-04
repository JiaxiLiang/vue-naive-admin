<template>
  <div class="f-c-c">
    <n-tooltip trigger="hover" placement="bottom">
      <template #trigger>
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

const appStore = useAppStore()

// getPresetColors 的返回类型已在 arco-design-color.d.ts 声明为 Record<string, { primary: string }>，直接取值
const primaryColors = Object.entries(getPresetColors()).map(([, value]) => value.primary)
</script>
