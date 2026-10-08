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
// 多页签栏：展示已访问路由的页签（数据来自 tab store，由路由守卫 addTab 维护），点击切换路由，右键唤出 ContextMenu 做刷新与批量关闭
import type { TabItem } from '@/store'
import { useTabStore } from '@/store'
import ContextMenu from './ContextMenu.vue'

const router = useRouter()
const tabStore = useTabStore()

// 右键菜单状态：坐标与目标页签路径，show 与 ContextMenu 双向同步
const contextMenuOption = reactive({
  show: false,
  x: 0,
  y: 0,
  currentPath: '',
})

/** 点击页签：同步激活态并跳到对应路由 */
function handleItemClick(path: string) {
  tabStore.setActiveTab(path)
  router.push(path)
}

// 菜单显隐与定位的小工具函数，供右键处理复用
function showContextMenu() {
  contextMenuOption.show = true
}
function hideContextMenu() {
  contextMenuOption.show = false
}
function setContextMenu(x: number, y: number, currentPath: string) {
  Object.assign(contextMenuOption, { x, y, currentPath })
}

/** 右键页签：先隐藏再在 nextTick 后携新坐标/目标重新显示，避免菜单复用旧定位不刷新 */
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
