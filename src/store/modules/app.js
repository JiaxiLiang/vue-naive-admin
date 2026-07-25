// 应用状态：侧边栏状态、设备类型（移动/PC）、UI 设置
// 仓库只管页面状态 不管数据 （是否折叠这种）
import { generate, getRgbStr } from '@arco-design/color'
// 第三方库 引入 Arco Design 的颜色生成与 RGB 格式转换工具
import { useDark } from '@vueuse/core'
// 第三方 引入 VueUse 的暗黑模式 Hook，用于管理暗黑模式状态
import { defineStore } from 'pinia'
// 引入 Pinia 的状态管理核心方法 defineStore创建仓库  defineStore（）参数1仓库id  参数2仓库配置
import { defaultLayout, defaultPrimaryColor, naiveThemeOverrides } from '@/settings'
// 引入全局配置中的默认布局、默认主色调及 Naive UI 主题覆盖对象
// 里就会初始化页面的各种状态 （初始化就是白色的等）

// pinia仓库三大板块：state：存放数据    getters：存放计算属性  actions：存放修改数据的方法
export const useAppStore = defineStore('app', { // 定义并导出名为 'app' 的仓库 {}把参数2打包成对象
  state: () => ({ // 声明 Store 的初始状态工厂函数
    collapsed: false, // 侧边栏菜单是否折叠（默认不折叠）
    isDark: useDark(), // 是否开启暗黑模式，初始值由 useDark Hook 根据系统或缓存决定
    layout: defaultLayout, // 当前系统的布局模式（如侧边菜单、顶部菜单等）
    primaryColor: defaultPrimaryColor, // 当前系统的主题色（默认主色调）
    naiveThemeOverrides, // Naive UI 组件库的主题覆盖配置对象
  }),
  // 因为这里{ state: ...} 这里的配置是箭头函数（返回值是对象就得加（））
  // 如果不是箭头函数 直接用对象来赋值那么就是多个用户操作同一个地址 而用函数就可以每次使用都会开辟不同内存
  actions: {
    // 声明 Store 的操作方法
    // 这些函数只是及时跟新仓库的状态并不是真实的修改页面的状态
    // 路径是 用户点击 组件调用action函数 函数修改pinia仓库数据 vue系统根据仓库改变组件
    // 路由是负责网址更改之后页面切换这个环节的   单一页面组件的变化是vue响应式系统负责的
    switchCollapsed() { // 切换侧边栏展开/折叠状态的方法
      this.collapsed = !this.collapsed // 将当前折叠状态取反并赋值给自身
    },
    // this始终是指向仓库 这是例外（正常谁调用函数this就是谁）底层有了bind函数绑定
    setCollapsed(b) { // 直接设置侧边栏折叠状态的方法
      this.collapsed = b // 给组件传入的布尔值赋给 collapsed 状态
    },
    toggleDark() { // 切换暗黑/明亮模式的方法
      this.isDark = !this.isDark // 将当前暗黑模式状态取反并赋值给自身
    },
    setLayout(v) { // 修改系统布局模式的方法
      this.layout = v // 将传入的布局配置赋值给 layout 状态
    },
    setPrimaryColor(color) { // 修改系统主题色的方法
      this.primaryColor = color // 将传入的颜色值赋给 primaryColor 状态
    },
    setThemeColor(color = this.primaryColor, isDark = this.isDark) {
      // 生成并应用主题色到全局 CSS 变量和组件库的方法
      const colors = generate(color, { // 调用第三方库生成对应的页面的调色板（一个数组存储）
        list: true, // 以数组形式返回色板
        dark: isDark, // 根据当前是否为暗黑模式生成对应的色板
      })
      document.body.style.setProperty('--primary-color', getRgbStr(colors[5]))
      // setProperty设置样式  参数--primary-color就是css代入颜色
      // getRgbStr第三方 把十六进制函数转纯数字 [5]一般是最纯的色调
      // 将页面的主体的style中的--primary-color设置为[5]
      this.naiveThemeOverrides.common = Object.assign(this.naiveThemeOverrides.common || {}, {
        // naiveThemeOverrides Naive UI 的配置对象 .common (通用主题区块)
        // Object全局对象（所有对象鼻祖）  assign（目标函数,源函数）
        // Object.assign把参数2的数据给到参数1（参数1没有就增加有就替换 不会清空参数1数据）
        primaryColor: colors[5], // 设置 Naive UI 组件的默认主色
        primaryColorHover: colors[4], // 设置鼠标悬停时的主色（比主色略亮）
        primaryColorSuppl: colors[4], // 设置补充状态的主色
        primaryColorPressed: colors[6], // 设置鼠标按下时的主色（比主色略暗）
      })
    },
  },
  persist: { // 配置 Pinia 的状态持久化插件
    pick: ['collapsed', 'layout', 'primaryColor', 'naiveThemeOverrides'], // 指定需要被持久化存储的 state 字段
    // pick是挑选可以保留的数据 数组的形式
    storage: sessionStorage,
    // 指定持久化存储的媒介为 sessionStorage（关闭浏览器标签页即清空）
    // storage存储媒介
  },
})
/*
🎨 浏览器内核层次关系全景知识点 (HTML + CSS + DOM + Vue)

🎯 1. 浏览器窗口 window浏览器窗口的全局对象 所有其他的组件对象都是挂载在这上的
   │
   │  🧠 (幕后英雄：渲染引擎 & JS引擎)
   │     ├── 渲染引擎：负责解析 HTML/CSS，画出页面
   │     └── JS 引擎：负责执行 JS 代码，操作 DOM
   │
   ▼
🌳 2. DOM 树
   │  【定义】浏览器将 HTML 代码解析后生成的内存对象树。
   │  【本质】JS 对象树。JS 想修改页面，必须操作这里的对象。
   │  【核心概念】
   │     ├── 节点：树上的每一个点（标签、文本、注释）都叫节点。
   │     ├── 根节点：document 文档节点，是树的入口。
   │     └── 元素节点：HTML 标签对应的节点（如 <div>）。
   │
   ▼
📞 document (根节点 / 总指挥)
   │  (JS 中常用：document.querySelector...)
   │
   ▼
🏢 <html> (根元素节点 / 所有标签的祖宗)
   │
   ├── 🏚️ <head> (元数据节点 / 看不见的配置)
   │     ├── <meta> (编码配置)
   │     ├── <title> (网页标题 - 浏览器标签页显示)
   │     │
   │     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   │     ┃ 🎨 CSS 样式层 (页面的"皮肤"和"化妆师")
   │     ┃  ├── <style> (内部样式表)
   │     ┃  ├── <link rel="stylesheet"> (外部引入的 .css 文件)
   │     ┃  │
   │     ┃  ⚡ 作用机制：
   │     ┃     1. 浏览器解析 CSS 生成 CSSOM 树 (样式规则树)。
   │     ┃     2. 将 CSSOM 样式 "挂载" 到 DOM 树对应的节点上。
   │     ┃     3. 最终决定节点在屏幕上的大小、颜色、位置。
   │     ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   │
   └── 🏬 <body> (主体节点 / 用户可见区域)
         │
         │  (JS 操作示例：document.body.style.background = 'red')
         │
         └── 🏢 <div id="app"></div> (挂载点 / Vue 的地皮)
               │
               │  ⏳ 【Vue 工作区】(Vue 接管此处，开始异步更新)
               │     1. 生成 虚拟DOM (Virtual DOM) (JS 对象模拟)。
               │     2. 数据变化 -> 对比差异 -> 异步更新真实 DOM。
               │
               ▼
             🎄 App.vue (根组件实例 / Vue 大楼主体)
               │
               ├── 🪟 组件节点 (Sidebar.vue) -> 渲染为 <aside class="sidebar">...</aside>
               │     └── 🍃 文本节点: "菜单"
               │     └── 🍃 属性节点: class="active" (这里受 CSS 样式影响)
               │
               ├── 🚪 组件节点 (Navbar.vue) -> 渲染为 <header>...</header>
               │
               └── 🛋️ 组件节点 (Content.vue) -> 渲染为 <main>...</main>
                     │
                     └── 🖼️ HTML 节点结构
                           └── 🍃 元素节点 <span class="text">
                                 └── 🍃 文本节点: "Hello World"
       ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ┃ 💡 关键总结：
       ┃ 1. DOM 是树，节点是树叶。
       ┃ 2. HTML 决定树干结构，CSS 决定树叶颜色。
       ┃ 3. JS 是园丁，通过 document 修剪树叶。
       ┃ 4. Vue 是自动化园丁，在 id="app" 下面自动管理树枝。
       ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

/*
 JS 里改变 this 的“三剑客”知识点
// 1. 准备一个目标对象（我们想让 this 指向它）
const car = { name: '宝马' }
// 2. 准备一个普通函数，它内部用到了 this
function drive(speed, destination) {
  console.log(`驾驶${this.name}，以${speed}的速度去${destination}`)
}
// 3. 使用 call：立即执行，参数一个个传
drive.call(car, 120, '北京');
// 打印：驾驶宝马，以120的速度去北京

// 4. 使用 apply：立即执行，参数用数组传
drive.apply(car, [80, '上海']);
// 打印：驾驶宝马，以80的速度去上海

// 5. 使用 bind：不立即执行，返回一个绑定了 this 的新函数
const boundDrive = drive.bind(car, 60, '广州');
boundDrive(); // 需要手动调用一次
// 打印：驾驶宝马，以60的速度去广州

*/
/*
                           [应用状态Store: useAppStore]
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
        [初始化State]               [执行Actions]              [持久化Persist]
           │                          │                          │
           ▼                          ▼                          ▼
      ┌────────────┐            [触发具体方法]            [存入sessionStorage]
      │折叠态:false│                   │                 (折叠/布局/主色/主题)
      │暗黑:跟随系统│      ┌────────────┴────────────┐           │
      │布局:默认配置│      │                         │           │
      │主色:默认配置│      ▼                         ▼           │
      │主题:初始配置│ [基础状态赋值操作]        [高级复合操作]     │
      └────────────┘ ├─switchCollapsed        (setThemeColor)   │
           │         ├─setCollapsed                 │           │
           │         ├─toggleDark                   ▼           │
           │         ├─setLayout              ┌──────────────────┐
           │         └─setPrimaryColor        │ 1.生成色板列表   │
           │                  │               │  (适配明暗模式)  │
           │                  │               │ 2.提取RGB字符串  │
           │                  │               │ 3.设置CSS变量    │
           │                  │               │ 4.更新UI主题变量 │
           │                  │               └────────┬─────────┘
           │                  │                        │
           │                  └────────────┬───────────┘
           │                               │
           └───────────────────────────────┼───────────────────────┐
                                           │                       │
                                           ▼                       │
                                  [状态更新并驱动视图渲染]          │
                                                                   │
    <───────────────────────────────────────────────────────────────┘ (闭环：状态变更自动触发持久化与视图更新)

*/
