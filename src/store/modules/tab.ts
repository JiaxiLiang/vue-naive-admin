// 多页签仓库：记录已打开页签，驱动 App.vue 的 KeepAlive 缓存名单与 reloading 重建机制
import type { RouteRecordName } from 'vue-router'
import { defineStore } from 'pinia'
import { useRouterStore } from './router'

/** 标签页条目（实际字段以 guards/tab-guard 的 addTab 调用为准） */
export interface TabItem {
  path: string
  /** to.name 类型上可空（vue-router 契约如此），如实放宽 */
  name?: RouteRecordName | null
  title?: string
  keepAlive?: boolean
  [key: string]: unknown
}

export const useTabStore = defineStore('tab', {
  state: () => ({
    tabs: [] as TabItem[],
    activeTab: '',
    reloading: false,
  }),
  getters: {
    /** 当前激活页签的下标，不存在为 -1 */
    activeIndex: (state) => {
      return state.tabs.findIndex(item => item.path === state.activeTab)
    },
  },
  actions: {
    /** 激活指定页签；等 DOM 更新完成后再定位，避免高亮错位 */
    async setActiveTab(path: string) {
      await nextTick()
      this.activeTab = path
    },
    /** 整体替换页签列表 */
    setTabs(tabs: TabItem[]) {
      this.tabs = tabs
    },
    /** 已存在则原位更新信息，否则追加到末尾，并将其设为激活 */
    addTab(tab: TabItem = {} as TabItem) {
      const findIndex = this.tabs.findIndex(item => item.path === tab.path)
      if (findIndex !== -1) {
        this.tabs.splice(findIndex, 1, tab)
      }
      else {
        this.setTabs([...this.tabs, tab])
      }
      this.setActiveTab(tab.path)
    },
    /**
     * 刷新页签对应的页面：先摘掉 keepAlive 让 KeepAlive 缓存失效、
     * 置 reloading 卸载组件，再恢复原配置——以此绕过缓存强制重建页面
     */
    async reloadTab(path: string, keepAlive?: boolean) {
      const findItem = this.tabs.find(item => item.path === path)
      if (!findItem)
        return
      if (keepAlive)
        findItem.keepAlive = false
      $loadingBar.start()
      this.reloading = true
      await nextTick()
      this.reloading = false
      findItem.keepAlive = !!keepAlive
      // 延迟收尾：等重建页面完成首帧渲染再回滚顶部、收起进度条
      setTimeout(() => {
        document.documentElement.scrollTo({ left: 0, top: 0 })
        $loadingBar.finish()
      }, 100)
    },
    /** 移除页签；若关的是激活页签则跳到剩余最后一个，全部关完则原地不动 */
    async removeTab(path: string) {
      this.setTabs(this.tabs.filter(tab => tab.path !== path))
      if (path === this.activeTab) {
        const last = this.tabs.at(-1)
        if (last)
          useRouterStore().router?.push(last.path)
      }
    },
    /** 关闭除指定页签外的全部页签；激活页签被关时跳到剩下的页签 */
    removeOther(curPath?: string) {
      curPath = curPath ?? this.activeTab
      this.setTabs(this.tabs.filter(tab => tab.path === curPath))
      if (curPath !== this.activeTab) {
        const last = this.tabs.at(-1)
        if (last)
          useRouterStore().router?.push(last.path)
      }
    },
    /** 关闭指定页签左侧的全部页签；激活页签被关时跳到末尾 */
    removeLeft(curPath: string) {
      const curIndex = this.tabs.findIndex(item => item.path === curPath)
      const filterTabs = this.tabs.filter((item, index) => index >= curIndex)
      this.setTabs(filterTabs)
      if (!filterTabs.some(item => item.path === this.activeTab)) {
        const last = filterTabs.at(-1)
        if (last)
          useRouterStore().router?.push(last.path)
      }
    },
    /** 关闭指定页签右侧的全部页签；激活页签被关时跳到末尾 */
    removeRight(curPath: string) {
      const curIndex = this.tabs.findIndex(item => item.path === curPath)
      const filterTabs = this.tabs.filter((item, index) => index <= curIndex)
      this.setTabs(filterTabs)
      if (!filterTabs.some(item => item.path === this.activeTab)) {
        const last = filterTabs.at(-1)
        if (last)
          useRouterStore().router?.push(last.path)
      }
    },
    /** 清空全部页签状态（登出/换号时调用） */
    resetTabs() {
      this.$reset()
    },
  },
  // 仅持久化页签列表到 sessionStorage，刷新后可恢复已打开的页签
  persist: {
    pick: ['tabs'],
    storage: sessionStorage,
  },
})
