<template>
  <n-menu
    ref="menu"
    class="side-menu"
    accordion
    :indent="18"
    :collapsed-icon-size="22"
    :collapsed-width="64"
    :collapsed="appStore.collapsed"
    :options="(permissionStore.menus as any)"
    :value="(activeKey as any)"
    @update:value="handleMenuSelect"
  />
</template>

<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import { useAppStore, usePermissionStore } from '@/store'
import { isExternal } from '@/utils'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const activeKey = computed(() => route.meta?.parentKey || route.name)

const menu = ref<{ showOption: () => void } | null>(null)
watch(route, async () => {
  await nextTick()
  menu.value?.showOption()
})

function handleMenuSelect(key: string, item: MenuOption | null) {
  if (isExternal(item?.originPath as string)) {
    $dialog.confirm({
      type: 'info',
      title: `请选择打开方式`,
      positiveText: '外链打开',
      negativeText: '在本站内嵌打开',
      confirm() {
        window.open(item?.originPath as string)
      },
      cancel: () => {
        router.push(item?.path as string)
      },
    })
  }
  else {
    if (!item?.path)
      return
    router.push(item?.path as string)
  }
}
</script>

<style>
.side-menu:not(.n-menu--collapsed) {
  .n-menu-item-content {
    &::before {
      left: 8px;
      right: 8px;
    }
    &.n-menu-item-content--selected::before {
      border-left: 4px solid rgb(var(--primary-color));
    }
  }
}
</style>
