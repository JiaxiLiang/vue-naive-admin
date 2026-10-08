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
// 页签右键菜单：在鼠标坐标处弹出 n-dropdown，提供重新加载/关闭/关闭其他/关闭左侧/关闭右侧操作；自身只分发动作，实现全部收敛在 tab store
import { useTabStore } from '@/store'

// show/x/y/currentPath 由页签栏在右键时传入，show 经 update:show 双向回传以收起菜单
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

// 按右键目标页签的位置决定可用性：重新加载仅对激活页签开放；关闭左侧/右侧在目标已处于列表边缘时禁用
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

/** 动作表：key 与菜单项 key 一一对应（TabAction 由本表派生，两处天然一致），操作最终都落在 tab store 的对应方法上 */
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

/** 点击菜单外部时收起菜单（v-model:show） */
function handleHideDropdown() {
  emit('update:show', false)
}

/** 执行右键选中的动作后收起菜单；key 均来自 actionMap（字符串），number 分支理论不可达 */
function handleSelect(key: string | number) {
  const actionFn = actionMap[key as TabAction]
  actionFn?.()
  handleHideDropdown()
}
</script>
