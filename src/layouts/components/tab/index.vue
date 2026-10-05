<template>
  <div id="top-tab">
    <n-tabs
      :value="tabStore.activeTab"
      :closable="tabStore.tabs.length > 1"
      type="card"
      @close="(path) => tabStore.removeTab(path)"
    >
      <n-tab
        v-for="item in tabStore.tabs"
        :key="item.path"
        :name="item.path"
        @click="handleItemClick(item.path)"
        @contextmenu.prevent="handleContextMenu($event, item)"
      >
        {{ item.title }}
      </n-tab>
    </n-tabs>

    <ContextMenu
      v-if="contextMenuOption.show"
      v-model:show="contextMenuOption.show"
      :current-path="contextMenuOption.currentPath"
      :x="contextMenuOption.x"
      :y="contextMenuOption.y"
    />
  </div>
</template>

<script setup lang="ts">
import type { TabItem } from '@/store'
import { useTabStore } from '@/store'
import ContextMenu from './ContextMenu.vue'

const router = useRouter()
const tabStore = useTabStore()

const contextMenuOption = reactive({
  show: false,
  x: 0,
  y: 0,
  currentPath: '',
})

function handleItemClick(path: string) {
  tabStore.setActiveTab(path)
  router.push(path)
}

function showContextMenu() {
  contextMenuOption.show = true
}
function hideContextMenu() {
  contextMenuOption.show = false
}
function setContextMenu(x: number, y: number, currentPath: string) {
  Object.assign(contextMenuOption, { x, y, currentPath })
}

// 右击菜单
async function handleContextMenu(e: MouseEvent, tagItem: TabItem) {
  const { clientX, clientY } = e
  hideContextMenu()
  setContextMenu(clientX, clientY, tagItem.path)
  await nextTick()
  showContextMenu()
}
</script>

<style scoped>
:deep(.n-tabs) {
  .n-tabs-tab {
    padding: 0 14px;
    height: 30px;
    margin-right: 6px;
    border: none !important;
    border-radius: 6px !important;
    transition:
      background-color 0.2s,
      color 0.2s;
    &:hover {
      background-color: rgba(var(--primary-color), 0.12) !important;
    }
  }
  .n-tabs-tab--active {
    background-color: rgb(var(--primary-color)) !important;
    color: #fff !important;
    .n-base-close {
      color: #fff;
    }
  }
  .n-tabs-pad,
  .n-tabs-tab-pad,
  .n-tabs-scroll-padding {
    border: none !important;
  }
}
</style>
