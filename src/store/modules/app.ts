// 应用 UI 状态仓库：侧边栏折叠、布局模式、主题色与明暗。只管界面状态，不碰业务数据
import type { GlobalThemeOverrides } from 'naive-ui'
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'
import type { WritableComputedRef } from 'vue'
import type { LayoutMode } from '@/settings'
import { generate, getRgbStr } from '@arco-design/color'
import { useDark } from '@vueuse/core'
import { defineStore } from 'pinia'
import { defaultLayout, defaultPrimaryColor, naiveThemeOverrides } from '@/settings'

// 持久化字段名单：以 keyof AppState 校验字段拼写；persist 选项整体收口为 PersistedStateOptions，
// 是为绕开插件对深层主题 state 的 Path 递归类型爆栈（TS2589）
const persistedKeys = ['collapsed', 'layout', 'primaryColor', 'naiveThemeOverrides'] as const satisfies ReadonlyArray<keyof AppState>

interface AppState {
  collapsed: boolean
  /** state 工厂持有 useDark() 的 computed ref，经 pinia 解包对外表现为 boolean */
  isDark: WritableComputedRef<boolean>
  /** '' 为旧持久化值的兼容过渡态，渲染时回退 meta.layout（见 App.vue） */
  layout: LayoutMode | ''
  primaryColor: string
  naiveThemeOverrides: GlobalThemeOverrides
}

export const useAppStore = defineStore('app', {
  // state 用工厂函数：每次初始化都生成全新对象，避免多实例共享同一引用
  state: (): AppState => ({
    collapsed: false,
    isDark: useDark(),
    layout: defaultLayout,
    primaryColor: defaultPrimaryColor,
    naiveThemeOverrides,
  }),
  actions: {
    /** 切换侧边栏折叠状态 */
    switchCollapsed() {
      this.collapsed = !this.collapsed
    },
    /** 直接设置侧边栏折叠状态 */
    setCollapsed(b: boolean) {
      this.collapsed = b
    },
    /** 切换明暗模式（初始值由 useDark 按系统/历史记录决定） */
    toggleDark() {
      this.isDark = !this.isDark
    },
    /** 设置全局默认布局模式 */
    setLayout(v: LayoutMode) {
      this.layout = v
    },
    /** 只记录主题色，色板重算统一由 setThemeColor 触发 */
    setPrimaryColor(color: string) {
      this.primaryColor = color
    },
    /**
     * 依据主色与明暗生成 arco 色板，同步写入 CSS 变量与 naive 主题覆盖
     * @param color 缺省取当前主题色
     * @param isDark 缺省取当前明暗状态
     */
    setThemeColor(color?: string, isDark?: boolean) {
      // strict 下默认参数位不能引用 this，改为函数体内取当前值兜底
      const themeColor = color ?? this.primaryColor
      const dark = isDark ?? this.isDark
      const colors = generate(themeColor, {
        list: true,
        dark,
      })
      // 色板第 5 档为标准色，写入 CSS 变量供自写样式取用
      document.body.style.setProperty('--primary-color', getRgbStr(colors[5]!))
      // 原地合并 common 区块：hover 用略亮档、pressed 用略暗档，保持主题层次
      const common = this.naiveThemeOverrides.common || {}
      Object.assign(common, {
        primaryColor: colors[5],
        primaryColorHover: colors[4],
        primaryColorSuppl: colors[4],
        primaryColorPressed: colors[6],
      })
      this.naiveThemeOverrides.common = common
    },
  },
  // 只持久化界面偏好；sessionStorage 会话级隔离，关闭标签页即还原默认
  persist: {
    pick: [...persistedKeys],
    storage: sessionStorage,
  } as PersistenceOptions,
})
