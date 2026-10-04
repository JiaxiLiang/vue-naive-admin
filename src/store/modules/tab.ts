// 标签状态仓库
import type { RouteRecordName } from 'vue-router'
import { defineStore } from 'pinia' // 引入 Pinia 的状态管理定义函数
import { useRouterStore } from './router' // 引入路由状态管理仓库，用于编程式导航

/** 标签页条目（实际字段以 guards/tab-guard 的 addTab 调用为准） */
export interface TabItem {
  path: string
  /** to.name 可为 null（vue-router 类型），此处如实放宽 */
  name?: RouteRecordName | null
  title?: string
  keepAlive?: boolean
  [key: string]: unknown
}

export const useTabStore = defineStore('tab', { // 定义并导出一个名为 'tab' 的状态仓库
  state: () => ({ // 定义仓库的初始状态
    tabs: [] as TabItem[], // 存储已打开的标签页列表数组
    activeTab: '', // 当前激活的标签页路径
    reloading: false, // 标识是否正在重新加载（刷新）当前页面
  }),
  getters: { // 定义计算属性
    // strict 模式下用 state 参数替代 this（运行时等价）
    activeIndex: (state) => { // 计算当前激活标签页在列表中的索引位置
      return state.tabs.findIndex(item => item.path === state.activeTab)
      // 查找并返回索引值 find方法查找 符合条件就返回索引不符合就是-1
    },
  },
  actions: { // 定义修改状态的方法
    async setActiveTab(path: string) { // 设置当前激活的标签页 就是代表路由的路径
      await nextTick() // 等待下一个 DOM 更新周期，确保视图更新后再设置，避免定位失效
      this.activeTab = path // 更新当前激活标签页路径
    },
    setTabs(tabs: TabItem[]) { // 直接设置标签页列表
      this.tabs = tabs // 将传入的新数组赋值给状态
    },
    addTab(tab: TabItem = {} as TabItem) { // 添加或更新一个标签页
      const findIndex = this.tabs.findIndex(item => item.path === tab.path)
      // 查找该标签页是否已存在
      if (findIndex !== -1) { // 如果存在（索引不为-1）
        this.tabs.splice(findIndex, 1, tab) // 替换旧标签页信息（更新）
      }
      else { // 如果不存在
        this.setTabs([...this.tabs, tab]) // 将新标签页添加到列表末尾
      }
      this.setActiveTab(tab.path) // 将新添加/更新的标签页设为激活状态
    },
    async reloadTab(path: string, keepAlive?: boolean) {
      // 刷新指定标签页内容
      const findItem = this.tabs.find(item => item.path === path) // 查找目标标签页对象
      if (!findItem) // 如果未找到则直接返回
        return
      // 通过修改 keepAlive 属性使 keep-alive 缓存失效，从而实现刷新效果
      if (keepAlive) // 如果配置了缓存
        findItem.keepAlive = false // 先关闭缓存使 keep-alive 失效，刷新完成后在下方恢复原配置
      $loadingBar.start() // 启动页面加载进度条（全局插件）
      this.reloading = true // 开启刷新状态标识
      await nextTick() // 等待 DOM 更新
      // nextTick() 的作用本质就是只是在微任务里面插入一个任务来做到异步
      this.reloading = false // 关闭刷新状态标识，触发组件重新渲染
      findItem.keepAlive = !!keepAlive // 恢复原有的缓存配置
      setTimeout(() => { // 设置定时器，在刷新后执行
        document.documentElement.scrollTo({ left: 0, top: 0 }) // 滚动页面回到顶部
        $loadingBar.finish() // 结束加载进度条
      }, 100) // 延迟 100 毫秒执行
    },
    async removeTab(path: string) { // 移除指定路径的标签页
      this.setTabs(this.tabs.filter(tab => tab.path !== path))
      // 过滤掉要移除的标签页，保留其他
      if (path === this.activeTab) { // 如果移除的是当前激活的标签页
        // 激活页被关时跳到剩余的最后一个标签页；全部关完（列表为空）则无处可跳，静默结束
        const last = this.tabs.at(-1)
        if (last)
          useRouterStore().router?.push(last.path) // 自动跳转到列表中最后一个标签页
      }
    },
    removeOther(curPath?: string) { // 关闭除当前页签外的其他所有页签
      curPath = curPath ?? this.activeTab // 与原默认参数等价
      this.setTabs(this.tabs.filter(tab => tab.path === curPath)) // 只保留当前路径的标签页
      if (curPath !== this.activeTab) { // 如果当前路径不是激活路径（说明之前激活的标签页被关闭了）
        const last = this.tabs.at(-1)
        if (last)
          useRouterStore().router?.push(last.path) // 跳转到保留下来的标签页
      }
    },
    removeLeft(curPath: string) { // 关闭当前页签左侧的所有页签
      const curIndex = this.tabs.findIndex(item => item.path === curPath) // 找到当前页签的索引
      const filterTabs = this.tabs.filter((item, index) => index >= curIndex) // 截取当前索引及之后的标签页
      this.setTabs(filterTabs) // 更新标签页列表
      if (!filterTabs.some(item => item.path === this.activeTab)) { // 如果激活的标签页被关闭了
        const last = filterTabs.at(-1)
        if (last)
          useRouterStore().router?.push(last.path) // 跳转到新的末尾标签页
      }
    },
    removeRight(curPath: string) { // 关闭当前页签右侧的所有页签
      const curIndex = this.tabs.findIndex(item => item.path === curPath) // 找到当前页签的索引
      const filterTabs = this.tabs.filter((item, index) => index <= curIndex) // 截取当前索引及之前的标签页
      this.setTabs(filterTabs) // 更新标签页列表
      if (!filterTabs.some(item => item.path === this.activeTab)) { // 如果激活的标签页被关闭了
        const last = filterTabs.at(-1)
        if (last)
          useRouterStore().router?.push(last.path) // 跳转到新的末尾标签页
      }
    },
    resetTabs() { // 重置标签页状态
      this.$reset() // 调用 Pinia 内置方法恢复到初始状态
    },
  },
  persist: { // 配置状态持久化插件（如 pinia-plugin-persistedstate）
    pick: ['tabs'], // 选择需要持久化的字段，这里只缓存 tabs 数组
    storage: sessionStorage, // 指定存储介质为 sessionStorage（关闭浏览器即失效）
  },
})
