---
name: project-tree-map
description: vue-naive-admin 项目目录结构与文件职责速查地图——全项目逐文件中文注释树状图（含 VSCodeCounter 代码量统计）。当用户问「项目结构、目录是干嘛的、某个文件在哪、XX 逻辑在哪个文件、新代码该放哪个目录、文件清单、代码量分布」，或要求查看/生成/更新项目树状图、结构地图时使用——即使用户没说「树状图」三个字。
---

# 项目结构速查地图（逐文件注释树）

统计口径：VSCodeCounter code lines（不含空行与注释）。结构或代码量变化后：重跑 VSCodeCounter → 同步下方树中对应目录的数量标注与新增文件的职责注释（逐文件注释是本 skill 的核心价值，刷新时勿删勿略）。

```text
1-vue-naive-admin //根目录（TS 版）|Total: 459 files, 16,950 code lines
├─.editorconfig //编辑器配置：统一团队的代码缩进、换行符等编码风格
├─.env //环境变量配置：定义所有环境共用的全局变量（站点标题 VITE_TITLE）
├─.env.development //开发环境变量：开发环境的 API 地址、调试开关等
├─.env.production //生产环境变量：生产 API 地址（当前指向 apifox 云端 mock）
├─.npmrc //npm/pnpm 配置文件：设置包管理器的注册源、安装行为等
├─.VSCodeCounter //代码统计工具：统计项目代码量的辅助文件/目录
├─build //自定义构建脚本目录|4 files, 57 code lines
│ ├─index.ts //构建入口：整合自定义构建逻辑（图标扫描 getIcons 等工具函数）
│ └─plugin-isme //自定义 Vite 插件集合：构建期生成两个虚拟模块
│   ├─icons.ts //图标插件：扫描 SVG 图标名生成虚拟模块 isme:icons（UnoCSS safelist 数据源）
│   ├─index.ts //插件集合入口：统一导出自定义插件
│   └─page-pathes.ts //页面路径插件：扫描 views 目录生成虚拟模块 isme:page-pathes（动态路由组件路径表）
├─docs //（新增）项目文档目录：架构说明、TS 验收报告、迁移进度归档|9 files, 585 code lines
├─auto-imports.d.ts //（新增）自动导入类型声明：unplugin 生成，vue/vue-router API 免 import 的类型来源
├─components.d.ts //（新增）组件类型声明：unplugin 生成，NaiveUI 组件免 import 的类型来源
├─eslint.config.ts //ESLint 配置（@antfu 预设 + TS）：定义代码检查规则，保证代码质量
├─index.html //HTML 入口：Vite 项目的唯一 HTML 模板，引入挂载点 #app
├─package.json //项目清单：依赖、脚本（dev/build/typecheck/test/test:type）
├─pnpm-lock.yaml //依赖版本锁定：确保团队成员安装的依赖版本完全一致
├─pnpm-workspace.yaml //Monorepo 工作区配置：当前为单包项目预留
├─public //静态资源目录：存放不需要经过构建处理的静态文件
│ └─favicon.png //网站图标：浏览器标签页显示的小图标
├─src //核心源代码目录（全 .ts/.vue，零 .js 残留）|405 files, 7,437 code lines
│ ├─api //API 接口层|1 file, 113 code lines
│ │ └─index.ts //全局 API 聚合层：createCrudApi<T,Q> 泛型 CRUD 工厂 + 认证/角色/权限接口
│ ├─App.vue //根组件：整个应用的顶层组件，包含路由出口与全局配置入口
│ ├─assets //资产目录
│ │ ├─icons //SVG 图标库
│ │ │ ├─dynamic-icons.ts //图标动态注册模块：扫描 feather/isme 目录，经虚拟模块 isme:icons 供 UnoCSS 使用
│ │ │ ├─feather //Feather Icons 图标源文件：存放第三方的 SVG 文件（291 个）
│ │ │ └─isme //项目自定义图标：存放本项目特有的 SVG 文件
│ │ └─images //全局图像资源：存放 logo、背景图等图片文件
│ ├─components //全局共享组件|15 files, 694 code lines
│ │ ├─common //基础通用组件|9 files, 264 code lines
│ │ │ ├─AppCard.vue //卡片容器组件：带边框和圆角的通用容器
│ │ │ ├─AppPage.vue //页面布局容器：处理页面内边距和背景的容器
│ │ │ ├─CommonPage.vue //通用页面容器：包含常见页面结构的组件
│ │ │ ├─index.ts //组件注册索引：统一导出 common 目录下的组件
│ │ │ ├─LayoutSetting.vue //布局配置弹窗：用于调整侧边栏、主题等设置
│ │ │ ├─TheFooter.vue //全局页脚组件：显示版权信息等
│ │ │ ├─TheLogo.vue //全局 Logo 组件：显示品牌标识
│ │ │ ├─ThemeSetting.vue //主题设置组件：切换亮色/暗色模式等
│ │ │ └─ToggleTheme.vue //主题切换按钮：具体的切换触发按钮
│ │ ├─index.ts //组件统一导出入口：方便全局引用
│ │ └─me //高级业务组件|5 files, 428 code lines
│ │   ├─crud //CRUD 组件：表格+搜索+分页+导出的高阶封装
│ │   │ ├─index.vue //MeCrud 泛型组件（generic 声明 T/Q）：Q 经 :get-data 反向推断查询字段类型
│ │   │ └─QueryItem.vue //查询表单项：声明式生成搜索表单的子组件
│ │   ├─index.ts //业务组件导出入口
│ │   └─modal //全局弹窗组件：封装的模态框逻辑
│ │     ├─index.vue //MeModal 可拖拽弹窗壳：open/close/okLoading 受控三态，expose 满足 MeModalExposed 契约
│ │     └─utils.ts //弹窗拖拽工具：initDrag 头部拖拽实现（弹窗叠层时取最上层）
│ ├─composables //组合函数层（TS 新增 4 个，useAliveData 已移除）|8 files, 416 code lines
│ │ ├─index.ts //Hooks 统一导出
│ │ ├─useCrud.ts //CRUD 编排 Hook：聚合 useForm+useModal，泛型 T 约束增删改查全流程
│ │ ├─useEnableRow.ts //（新增）行内开关 Hook：按行 loading + 调更新接口 + 提示刷新
│ │ ├─useForm.ts //表单逻辑 Hook：返回 [formRef, formModel, validation, rules] 四元组
│ │ ├─useModal.ts //弹窗控制 Hook：返回 [modalRef, okLoading]，双向代理弹窗加载态
│ │ ├─useRequest.ts //（新增）异步请求标准件：loading/error 三态 + AbortController 竞态防护与自动取消
│ │ ├─useRouteQuery.ts //（新增）路由 query 双向桥：筛选状态同步 URL，刷新/分享/回退不丢
│ │ └─useUserInfoColumns.ts //（新增）用户列配置 Hook：类型化列渲染 + user/role 两页跨页复用通道
│ ├─directives //自定义指令层|1 file, 41 code lines
│ │ └─index.ts //指令注册入口：v-permission 按钮级权限指令（无权限码移除 DOM 节点）
│ ├─layouts //页面布局层|20 files, 793 code lines
│ │ ├─components //布局内部组件|11 files, 626 code lines
│ │ │ ├─BeginnerGuide.vue //新手引导组件：首次登录时的指引遮罩
│ │ │ ├─BreadCrumb.vue //面包屑导航：显示当前页面路径
│ │ │ ├─Fullscreen.vue //全屏切换组件：控制浏览器全屏
│ │ │ ├─index.ts //布局组件导出
│ │ │ ├─MenuCollapse.vue //菜单折叠按钮：控制侧边栏展开/收起
│ │ │ ├─RoleSelect.vue //角色选择器：切换当前用户角色的上下文
│ │ │ ├─SideLogo.vue //侧边栏 Logo：侧边栏顶部的品牌标识
│ │ │ ├─SideMenu.vue //侧边栏菜单：渲染导航菜单树
│ │ │ ├─tab //多标签页系统模块
│ │ │ │ ├─ContextMenu.vue //标签页右键菜单：关闭其他、关闭所有等操作
│ │ │ │ └─index.vue //标签页栏组件：显示打开的页面标签
│ │ │ └─UserAvatar.vue //用户头像组件：显示头像及下拉菜单（退出、个人中心）
│ │ ├─empty //空白布局：用于登录页、注册页等无导航的页面
│ │ │ └─index.vue
│ │ ├─full //完整布局：包含 Header、Sidebar、Content 的全功能布局
│ │ │ ├─header/index.vue //完整布局的顶部栏
│ │ │ ├─index.vue //布局主容器
│ │ │ └─sidebar/index.vue //完整布局的侧边栏
│ │ ├─normal //常规布局：标准的后台管理布局（含面包屑）
│ │ │ ├─header/index.vue //常规布局的顶部栏
│ │ │ ├─index.vue //布局主容器
│ │ │ └─sidebar/index.vue //常规布局的侧边栏
│ │ └─simple //简易布局：简化版布局（仅简易侧边栏）
│ │   ├─index.vue //布局主容器
│ │   └─sidebar/index.vue //简易布局的侧边栏
│ ├─main.ts //应用初始化入口：装配 store/directives/router → 注入 http 认证 → 离散 API 跟随主题
│ ├─router //路由配置层|7 files, 524 code lines
│ │ ├─basic-routes.ts //基础路由：静态路由（Login/Home/404/403），satisfies 校验类型
│ │ ├─guards //路由守卫目录：拦截路由跳转的逻辑
│ │ │ ├─index.ts //守卫注册入口：统一引入并应用所有守卫
│ │ │ ├─page-loading-guard.ts //页面加载守卫：$loadingBar 开始/结束/错误三态控制
│ │ │ ├─page-title-guard.ts //页面标题守卫：根据路由 meta 动态修改网页标题
│ │ │ ├─permission-guard.ts //权限守卫：核心逻辑，Token 校验 + import.meta.glob 装配动态路由 + 403/404 兜底
│ │ │ └─tab-guard.ts //标签守卫：控制访问路由时自动添加到标签页列表
│ │ └─index.ts //路由实例创建：hash/history 双模式按 VITE_USE_HASH 切换
│ ├─settings.ts //全局配置字典：主题色、四种布局（as const 派生 LayoutMode）、静态权限 basePermissions
│ ├─store //状态管理层|9 files, 897 code lines
│ │ ├─helper.ts //Store 辅助函数：getUserInfo 重组用户数据、getPermissions 合并静态+动态权限
│ │ ├─index.ts //Store 根实例：createPinia + persistedstate 持久化插件
│ │ └─modules //状态模块目录：按功能拆分的状态模块
│ │   ├─app.ts //应用状态：折叠/布局/主题色/暗黑（useDark）+ 持久化白名单
│ │   ├─auth.ts //认证状态：accessToken 管理、resetLoginState 登出五仓连清
│ │   ├─index.ts //模块自动聚合：自动导入 modules 下所有文件
│ │   ├─permission.ts //权限状态：权限树递归生成动态路由表、菜单树、按钮权限码
│ │   ├─router.ts //路由状态：持有 router 实例，resetRouter 登出时移除动态路由
│ │   ├─tab.ts //标签状态：维护打开的 tabs 缓存列表
│ │   └─user.ts //用户状态：当前用户信息、头像、昵称、角色列表
│ ├─styles //全局样式层|2 files, 396 code lines
│ │ ├─global.css //全局通用样式：CSS 变量、通用类名
│ │ └─reset.css //样式重置：消除不同浏览器默认样式的差异
│ ├─types //（新增）类型契约目录：全项目类型定义收口于此|8 files, 276 code lines
│ │ ├─arco-design-color.d.ts //第三方库类型补丁：@arco-design/color 的模块声明
│ │ ├─env.d.ts //环境变量类型：VITE_ 前缀变量的类型声明（import.meta.env 提示）
│ │ ├─global.d.ts //全局类型：$message/$dialog 等离散 API 的 window 全局声明
│ │ ├─icons.ts //图标名类型：动态图标与 SVG 图标的类型定义
│ │ ├─me-components.ts //Me 组件共享类型：ModalOptions/MeModalExposed（useModal 与组件解耦防循环依赖）
│ │ ├─models.ts //★ 契约源头：Role/UserInfo/PermissionItem/PageResult 等全项目唯一实体定义处
│ │ ├─router.d.ts //vue-router 模块扩充：RouteMeta 增加 layout/keepAlive/btns 等业务字段
│ │ └─virtual-modules.d.ts //虚拟模块声明：isme:icons / isme:page-pathes 的模块类型
│ ├─utils //处理通用的工具函数|10 files, 708 code lines
│ │ ├─common.ts //通用工具：日期格式化等
│ │ ├─http //HTTP 请求封装
│ │ │ ├─auth-refresh.ts //（新增）Token 无感刷新：单飞锁+等待队列+原实例重放，刷新失败回落登录确认弹窗
│ │ │ ├─helpers.ts //错误归一化：业务码/HTTP 码/网络异常三分支（resolveResError）
│ │ │ ├─index.ts //Axios 实例 + 四个类型契约：ApiResult<T>/RequestError/RequestConfig/HttpClient
│ │ │ └─interceptors.ts //拦截器：请求注入 Bearer Token、响应剥壳统一报错、过期走无感刷新
│ │ ├─index.ts //Utils 统一导出入口
│ │ ├─is.ts //类型判断：isObject/isNullOrUndef 等，全部带 TS 类型守卫签名
│ │ ├─naiveTools.ts //NaiveUI 工具：离散 API（message/dialog）脱离组件上下文的装配封装
│ │ └─storage //本地存储封装
│ │   ├─index.ts //存储模块导出：lStorage/sStorage 实例（localStorage/sessionStorage 双模式）
│ │   └─storage.ts //Storage 类：JSON 信封 {value,time,expire} + 过期惰性清理
│ └─views //页面视图层|24 files, 2,313 code lines
│   ├─base //基础页面：用于测试或包裹的基础组件
│   │ ├─index.vue //基础布局骨架
│   │ ├─keep-alive.vue //缓存测试组件：测试 KeepAlive 生命周期
│   │ ├─test-modal.vue //弹窗测试页面
│   │ ├─unocss-icon.vue //UnoCSS 图标演示
│   │ └─unocss.vue //UnoCSS 原子化 CSS 演示
│   ├─demo //演示页面：功能实现的 Demo
│   │ └─upload
│   │   └─index.vue //文件上传功能演示
│   ├─error-page //错误页面
│   │ ├─403.vue //无权限页面
│   │ └─404.vue //页面不存在
│   ├─home //首页
│   │ └─index.vue //仪表盘/工作台页面（ECharts 图表）
│   ├─iframe //内嵌页面
│   │ └─index.vue //用于在系统内嵌套外部网站的容器
│   ├─login //登录模块
│   │ ├─api.ts //登录接口：调用后端登录、获取验证码接口
│   │ └─index.vue //登录页面：表单交互
│   ├─pms //权限管理系统|10 files, 1,268 code lines
│   │ ├─resource //资源管理：管理菜单、按钮、接口权限（左树右表联动） 616
│   │ │ ├─api.ts //资源接口
│   │ │ ├─components //资源管理私有组件
│   │ │ │ ├─MenuTree.vue //菜单树选择器
│   │ │ │ ├─QuestionLabel.vue //带提示的标签
│   │ │ │ └─ResAddOrEdit.vue //资源新增/编辑弹窗
│   │ │ └─index.vue //资源列表页面
│   │ ├─role //角色管理 381
│   │ │ ├─api.ts //角色接口
│   │ │ ├─index.vue //角色列表页面
│   │ │ └─role-user.vue //角色关联用户页面
│   │ └─user //用户管理 271
│   │   ├─api.ts //用户接口：createCrudApi<UserInfo,UserInfoQuery> 消费示例
│   │   └─index.vue //用户列表页面
│   └─profile //个人中心
│     ├─api.ts //个人信息接口
│     └─index.vue //个人资料修改页面
├─tests //（新增）单元测试目录：vitest + happy-dom|17 files, 1,622 code lines
│ ├─composables //组合函数测试|7 files, 526 code lines
│ │ ├─useCrud.spec.ts //CRUD 编排测试：弹窗动作/表驱动保存/删除确认
│ │ ├─useEnableRow.spec.ts //行内开关测试
│ │ ├─useForm.spec.ts //表单四元组测试
│ │ ├─useModal.spec.ts //弹窗控制测试
│ │ ├─useRequest.spec.ts //竞态防护与自动取消测试
│ │ ├─useRouteQuery.spec.ts //URL 同步测试
│ │ └─useUserInfoColumns.spec.ts //用户列配置测试
│ ├─store //状态仓库测试|3 files, 213 code lines
│ │ ├─permission.spec.ts //权限树/路由生成测试
│ │ ├─tab.spec.ts //标签页状态测试
│ │ └─user.spec.ts //用户状态测试
│ ├─types //类型级测试|1 file, 35 code lines
│ │ └─contracts.test-d.ts //契约类型测试：vitest --typecheck 验证类型约束本身
│ └─utils //工具与 http 测试|6 files, 848 code lines
│   ├─auth-refresh.spec.ts //（新增）无感刷新测试：锁/队列/重放全链路
│   ├─common.spec.ts //通用工具测试
│   ├─http.spec.ts //http 封装测试
│   ├─is.spec.ts //类型判断测试
│   ├─naiveTools.spec.ts //离散 API 测试
│   └─storage.spec.ts //存储封装测试
├─tsconfig.json //（新增，取代 jsconfig.json）TS 应用工程：strict 全开 + noUncheckedIndexedAccess，别名 @/~
├─tsconfig.node.json //（新增）TS 构建链工程：vite/uno/build 等 Node 侧文件单独收口
├─tsconfig.typecheck.json //（新增）TS 类型测试工程：供 vitest --typecheck 运行 *.test-d.ts
├─uno.config.ts //UnoCSS 配置：原子化 CSS（wind3+attributify+icons+remToPx 四预设）
├─vite.config.ts //Vite 核心配置：插件管线、别名、代理、自动导入、虚拟模块
└─vitest.config.ts //（新增）Vitest 测试配置：happy-dom 环境、覆盖率阈值 80/80/80/70、别名
```
