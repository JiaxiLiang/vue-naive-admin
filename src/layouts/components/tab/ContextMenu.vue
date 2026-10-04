<template>
  <n-dropdown
    :show="show"
    :options="options"
    :x="x"
    :y="y"
    placement="bottom-start"
    @clickoutside="handleHideDropdown"
    @select="handleSelect"
  />
</template>

<script setup lang="ts">
import { useTabStore } from '@/store'

const props = withDefaults(defineProps<{
  show?: boolean
  currentPath?: string
  x?: number
  y?: number
}>(), {
  show: false,
  currentPath: '',
  x: 0,
  y: 0,
})

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const tabStore = useTabStore()

const options = computed(() => [
  {
    label: '重新加载',
    key: 'reload',
    disabled: props.currentPath !== tabStore.activeTab,
    icon: () => h('i', { class: 'i-mdi:refresh text-14' }),
  },
  {
    label: '关闭',
    key: 'close',
    disabled: tabStore.tabs.length <= 1,
    icon: () => h('i', { class: 'i-mdi:close text-14' }),
  },
  {
    label: '关闭其他',
    key: 'close-other',
    disabled: tabStore.tabs.length <= 1,
    icon: () => h('i', { class: 'i-mdi:arrow-expand-horizontal text-14' }),
  },
  {
    label: '关闭左侧',
    key: 'close-left',
    disabled: tabStore.tabs.length <= 1 || props.currentPath === tabStore.tabs[0]?.path,
    icon: () => h('i', { class: 'i-mdi:arrow-expand-left text-14' }),
  },
  {
    label: '关闭右侧',
    key: 'close-right',
    disabled:
      tabStore.tabs.length <= 1
      || props.currentPath === tabStore.tabs.at(-1)?.path,
    icon: () => h('i', { class: 'i-mdi:arrow-expand-right text-14' }),
  },
])

const route = useRoute()

/** 右键菜单动作表：键即菜单 key（TabAction 由动作表派生，两处永远一致） */
const actionMap = {
  'reload': () => {
    tabStore.reloadTab(route.fullPath, route.meta?.keepAlive)
  },
  'close': () => {
    tabStore.removeTab(props.currentPath)
  },
  'close-other': () => {
    tabStore.removeOther(props.currentPath)
  },
  'close-left': () => {
    tabStore.removeLeft(props.currentPath)
  },
  'close-right': () => {
    tabStore.removeRight(props.currentPath)
  },
} satisfies Record<string, () => void>

type TabAction = keyof typeof actionMap

function handleHideDropdown() {
  emit('update:show', false)
}

function handleSelect(key: string | number) {
  // 菜单 options 的 key 都来自 actionMap（字符串），数字 key 理论不可达
  const actionFn = actionMap[key as TabAction]
  actionFn?.()
  handleHideDropdown()
}
</script>
