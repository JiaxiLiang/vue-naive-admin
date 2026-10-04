# vue-naive-admin 架构图 · 框架图（ASCII 分层管道版）

> **作用域**：整项目（`src/` · `build/` · `vite.config.ts` · `uno.config.ts`）
> **绘制依据**：逐个通读作用域内源码后绘制，图中每一行都能在代码里定位到实现，不是按目录名猜的
> **依赖方向**：自上而下。上层可调用下层；下层不 import 上层，只凭**注入/借阅**被借用（图中用 `▲` 标注）
> **姊妹文档**：`docs/architecture.md`（Mermaid 分层图）· `docs/arch-overview.md`（逐条链路详解）· `docs/architecture.html`（可视化版）· `docs/module-architecture.md`（CRUD 封装体系）

---

## 一、一句话需求定位

这个项目解决的是「**中后台管理系统的起步成本**」问题：把登录态、动态路由、按钮级权限、多标签页、布局切换、CRUD 增删改查这六件"每个后台都要重写一遍"的事，沉淀成可复用的骨架（`layouts/`）与半成品组件（`components/me/`）；业务页面只写「列配置 + 接口函数」，一行 `<MeCrud>` 出整页表格。

## 二、调用链（谁用它 → 它交付出什么 → 产物去向）

```text
浏览器 URL
  ► main.ts bootstrap()            装配 Pinia / 指令 / Router / 离散 API
  ► App.vue                        按 route.meta.layout || appStore.layout 取骨架
  ► layouts/{name}/index.vue       <slot/> 装入 views/ 页面
  ► views/*                        模板用 components/(MeCrud·MeModal)，setup 调 composables/(useCrud)
  ► composables/useCrud            执行注入进来的 doCreate/doUpdate/doDelete
  ► views/*/api.ts ► utils/http    请求拦截加 Bearer ► 后端接口
  ► 守卫 permission-guard          store 写入 menus/accessRoutes ► 菜单与路由就绪
```

## 三、图

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  图1【逻辑分层架构图】vue-naive-admin 整项目                             │
│  回答: 这个项目由哪些层构成、每层有哪些文件、谁组合谁、依赖往哪边走      │
│  字典: ──► 静态依赖(import/调用)   ╌╌► 运行时连接(ref 遥控/回调注入)     │
│        ► 同行步骤链    ===► 网络请求    ◄── 反向依赖(下层向上借)         │
│  方向: 自上而下。上层可调用下层；下层不 import 上层，只凭注入被借用(▲)   │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ pnpm dev ► Vite Dev Server (端口 3200)
┌──────────────────────────────────────────────────────────────────────────┐
│ 【工程启动层】package.json · vite.config.ts · uno.config.ts · build/     │
├──────────────────────────────────────────────────────────────────────────┤
│ 插件链: Vue ► VueJsx ► VueDevTools ► Unocss ► AutoImport                 │
│         ► Components ► pluginPagePathes ► pluginIcons ► removeNoMatch    │
│ 自动能力: ref/computed/useRoute 等免 import                              │
│   n-* 与 src/components 下的组件免注册                                   │
│ 虚拟模块: isme:icons(getIcons) · isme:page-pathes(getPagePathes)         │
│ 别名 @ ► src · ~ ► 项目根；server /api 代理 ──► VITE_PROXY_TARGET        │
│ dev: host 0.0.0.0 / port 3200 / open false                               │
│ build: 产物 dist/ · chunkSizeWarningLimit 1024kb                         │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ 浏览器访问 http://localhost:3200
┌──────────────────────────────────────────────────────────────────────────┐
│ 【应用引导层】main.ts · App.vue · settings.ts · directives/index.ts      │
├──────────────────────────────────────────────────────────────────────────┤
│ bootstrap(): ①createApp(App) ②setupStore ③setupDirectives                │
│              ④await setupRouter ⑤mount('#app') ⑥setupNaiveDiscreteApi    │
│ App.vue: n-config-provider(locale/theme/themeOverrides) ► 动态 Layout    │
│   └ <component :is> + <transition fade-slide> + <KeepAlive :include>     │
│ KeepAlive 名单 ◄ tabStore.tabs.filter(keepAlive).map(name)               │
│ settings.ts: defaultLayout · defaultPrimaryColor · basePermissions       │
│ directives: v-permission(读 route.meta.btns 的 code，无权限 el.remove)   │
│ 全局注入: $message $dialog $notification $loadingBar (挂在 window)       │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ mount 后首次导航，触发 beforeEach 守卫链
┌──────────────────────────────────────────────────────────────────────────┐
│ 【路由入口控制层】router/index.ts · basic-routes.ts · guards/            │
├──────────────────────────────────────────────────────────────────────────┤
│ basic-routes: /login(layout empty) · /(首页) · /404 · /403(empty)        │
│ guards/index: 按序注册 4 个守卫(注册序=执行序)                           │
│  ①page-loading: $loadingBar start ► afterEach finish(200ms) ► onError    │
│  ②permission ★: 白名单 login/404 ► 无 token 登录；有 token 补录          │
│  ③page-title: afterEach ► document.title = meta.title | VITE_TITLE       │
│  ④tab: afterEach ► tabStore.addTab(排除 /404 /403 /login)                │
│ permission-guard: 无 userInfo ► Promise.all[                             │
│   getUserInfo, getPermissions] 并发取回纯数据                            │
│   ► import.meta.glob(@/views/**/*.vue) 补 component ► router.addRoute    │
│   ► return {...to, replace:true} 重跑守卫；同名路由已注册 ──► 放行       │
│   └ 未注册 ──► api.validateMenuPath(path) ──► true: /403  false: /404    │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ ► 按 meta.layout || appStore.layout 取骨架
┌──────────────────────────────────────────────────────────────────────────┐
│ 【布局渲染层】layouts/ (四套骨架 + 公共布局件 + Tab 子系统)              │
├──────────────────────────────────────────────────────────────────────────┤
│ 布局由 [[布局详图]] 展开；四套骨架互斥，框内并排对照:                    │
│                                                                          │
│   ┌────────┬──────────────────┬─────────────────────────────────────┐    │
│   │ 骨架名 │ 来源             │ 组成与差异                          │    │
│   ├────────┼──────────────────┼─────────────────────────────────────┤    │
│   │ normal │ settings.ts 默认 │ 侧栏 + Header(内嵌 Tab) + 内容      │    │
│   │ full   │ LayoutSetting    │ 侧栏 + Header(面包屑) + 独立 Tab 行 │    │
│   │ simple │ LayoutSetting    │ 仅侧栏 + 内容；侧栏底部头像/折叠钮  │    │
│   │ empty  │ meta.layout      │ 裸 slot；登录 / 403 / 404 专用      │    │
│   └────────┴──────────────────┴─────────────────────────────────────┘    │
│                                                                          │
│ components/: SideMenu(n-menu ◄ permissionStore.menus) · SideLogo         │
│   BreadCrumb ◄ permissions 回溯父链 · MenuCollapse · Fullscreen          │
│   UserAvatar ► RoleSelect ► MeModal + useModal ◄ api.switchCurrentRole   │
│   BeginnerGuide(vue3-intro-step 的 7 个锚点)                             │
│ tab/: AppTab(n-tabs ◄ tabStore.tabs) + ContextMenu(右键 5 项操作)        │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ 骨架 <slot/> 装入 route 匹配到的页面组件
┌──────────────────────────────────────────────────────────────────────────┐
│ 【页面组件层】views/ (只写配置 + 接口函数 + 列渲染)                      │
├──────────────────────────────────────────────────────────────────────────┤
│ login: api.login(needToken false) ► authStore.setToken ► redirect 回跳   │
│ home: echarts 仪表盘(数据硬编码) · profile: 3×MeModal(改密/资料)         │
│ pms/user: 用户 CRUD + 重置密码 + 分配角色 + NSwitch 启停                 │
│ pms/role: 角色 CRUD + n-tree 权限勾选 · role-user: 批量授权/取消         │
│ pms/resource: 左 MenuTree + 右按钮表 + ResAddOrEdit(选图标/组件路径)     │
│ base/* 组件演示 · demo/upload 模拟上传 · iframe ◄ meta.originPath        │
│ error-page/403 404 · 视图全部 lazy: () => import(...)                    │
│ 列表页统一写法: <MeCrud :columns :get-data> + MeQueryItem + MeModal      │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ 模板用组件、setup 里 useCrud 装配
┌──────────────────────────────────────────────────────────────────────────┐
│ 【业务组件层】components/ (半成品 UI，不认识接口)                        │
├──────────────────────────────────────────────────────────────────────────┤
│ common/: AppPage(滚动主区+页脚+返回顶部) · AppCard · CommonPage          │
│   LayoutSetting(4 缩略图 ► appStore.setLayout) · ThemeSetting            │
│   ToggleTheme ► appStore.toggleDark(圆形 View Transition) · TheFooter    │
│ me/crud: MeCrud = 搜索 + NDataTable + 分页 + xlsx 导出 三合一            │
│   props: columns/getData/queryItems/scrollX/isPagination/remote          │
│   约定: 入参 {pageNo,pageSize} 出参 {data:{pageData,total}}              │
│   expose: handleSearch(keepCurrentPage) / handleReset / handleExport     │
│ me/modal: MeModal = 可拖拽弹窗壳 ► initDrag(bar,box) 纯 DOM              │
│   expose: open(options) / close / handleOk / okLoading                   │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ ► 模板 ref 遥控 MeModal / MeCrud
┌──────────────────────────────────────────────────────────────────────────┐
│ 【组合逻辑层】composables/ (useCrud 是唯一胶水)                          │
├──────────────────────────────────────────────────────────────────────────┤
│ useCrud({name, initForm, doCreate, doUpdate, doDelete, refresh})         │
│  内部装配: useModal() + useForm(initForm) 就地接收两原子件               │
│  handleAdd/Edit/View ► cloneDeep(initForm ⊕ row) ► modalRef.open         │
│    onOk 是函数 ──► 走它；否则 ──► handleSave；view ──► return false      │
│  handleSave: validation() ► okLoading=true ► await api ► cb 提示         │
│    ► refresh(data) 刷新列表；异常 ──► okLoading=false 且弹窗不关         │
│  handleDelete: $dialog.warning 确认 ► doDelete ► refresh(data,true)      │
│ useModal: modalRef(模板 ref 句柄) + okLoading(computed 双向代理)         │
│ useForm: formRef / formModel / rules / validation                        │
│ useAliveData: 按路由 name 缓存数据（暂未使用）                           │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ 全局态集中到 store，只存全局不存业务数据
┌──────────────────────────────────────────────────────────────────────────┐
│ 【状态层】store/ (Pinia 3 + persistedstate) 唯一事实源                   │
├──────────────────────────────────────────────────────────────────────────┤
│ setupStore: createPinia() ► use(piniaPluginPersistedstate) ► app.use     │
│ 边界: 只放全局态(登录/权限/布局/多标签)，业务数据不进 store              │
│   ┌────────────┬──────────────────────────┬─────────────────────┐        │
│   │ 模块       │ 关键 state               │ 持久化              │        │
│   ├────────────┼──────────────────────────┼─────────────────────┤        │
│   │ app        │ collapsed/layout/主色等  │ sessionStorage pick │        │
│   │ auth       │ accessToken              │ localStorage        │        │
│   │ user       │ userInfo(+6 个 getters)  │ 不持久化            │        │
│   │ permission │ menus/accessRoutes       │ 不持久化            │        │
│   │ router     │ router/route/resetRouter │ 不持久化            │        │
│   │ tab        │ tabs/activeTab/reloading │ sessionStorage pick │        │
│   └────────────┴──────────────────────────┴─────────────────────┘        │
│                                                                          │
│ auth.resetLoginState: ①resetRouter(accessRoutes) ②resetUser              │
│   ③resetPermission ④resetTabs ⑤resetToken ──► logout ──► toLogin         │
│ permission.setPermissions: permissions 原样存 ► menus 过滤 MENU          │
│   ► getMenuItem 递归 ► 排序；accessRoutes ► generateRoute                │
│ helper: getUserInfo(api.getUser)                                         │
│   · getPermissions(api.getRolePermissions ⊕ basePermissions)             │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ 请求全部走同一个 axios 实例
┌──────────────────────────────────────────────────────────────────────────┐
│ 【网络请求层】utils/http/ + api/ (收口在此，页面只管 catch)              │
├──────────────────────────────────────────────────────────────────────────┤
│ createAxios ► request(baseURL=VITE_AXIOS_BASE_URL, timeout 12s)          │
│   └ mockRequest(baseURL=/mock-api)                                       │
│ 请求拦截: needToken!==false ──► Authorization: Bearer ${accessToken}     │
│   └ ◄── 反向依赖: 本层向上借 authStore.accessToken 拼头                  │
│ 响应拦截: content-type json 且 code ∈ [0,200] ──► resolve(响应体)        │
│   └ 否则 resolveResError(code) ► reject({code, message})                 │
│ helpers: 401/11007/11008 ► $dialog 重新登录(防重复锁 isConfirming)       │
│   403/404/500 ► $message.error 中文文案；needTip:false 可静音            │
│ api/index.ts: getUser · refreshToken · logout · switchCurrentRole        │
│   · getRolePermissions · validateMenuPath (认证/权限专用)                │
│ views/*/api.ts: 各模块 CRUD 就近存放(login/user/role/resource/profile)   │
│ ===► 后端接口: dev 走 /api 代理，prod 走 VITE_AXIOS_BASE_URL             │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ 底座: 存储/判断/离散API/样式/第三方库
┌──────────────────────────────────────────────────────────────────────────┐
│ 【基础设施层】utils/ 其余 + styles/ + assets/ + 第三方                   │
├──────────────────────────────────────────────────────────────────────────┤
│ storage/: Storage 类(前缀 vue-naive-admin_ + JSON + expire 惰性清理)     │
│   ► lStorage / sStorage (登录页记住账号密码用)                           │
│ is.ts: isExternal/isNullOrUndef/... · common.ts: formatDateTime/         │
│   throttle/debounce/sleep · naiveTools.ts: createDiscreteApi             │
│ styles/ reset.css · global.css(--primary-color) · assets/icons           │
│ 第三方: Vue 3.5 · Pinia 3 · Naive UI 2 · UnoCSS · axios · lodash-es      │
│   @vueuse/core · dayjs · echarts · vue-echarts · xlsx 等                 │
└──────────────────────────────────────────────────────────────────────────┘
                               ▲ 下层凭注入/借阅反哺上层
                               │
┌──────────────────────────────────────────────────────────────────────────┐
│ 【反向支撑】(▲ 下层不主动调用上层，只被借用)                             │
├──────────────────────────────────────────────────────────────────────────┤
│ views/*/api.ts ──注入为 doCreate/doUpdate/doDelete──► useCrud 执行       │
│ 页面 refresh 回调 ──注入──► useCrud.refresh ╌╌► MeCrud.handleSearch      │
│ useModal.modalRef ╌╌► MeModal.open/close(模板 ref 遥控，零 import)       │
│ permissionStore.menus ──借阅──► SideMenu 渲染 n-menu                     │
│ authStore.accessToken ──借阅──► 请求拦截器拼 Bearer 头                   │
│ setupNaiveDiscreteApi ──全局注入──► 各层直接用 $message/$dialog          │
│ settings.basePermissions ──借阅──► getPermissions 与后端权限做 concat    │
└──────────────────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  图2【框架图】vue-naive-admin 构建期 + 运行期                            │
│  回答: 项目站在哪些框架之上、每个框架提供什么能力、能力落在哪一层        │
│  字典: ──► 能力供给方向      ╌╌► 注入/借用      ► 步骤链                 │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ pnpm dev / pnpm build 启动工程化框架
┌──────────────────────────────────────────────────────────────────────────┐
│ 【构建期框架】vite.config.ts + uno.config.ts + build/ (Vite 8)           │
├──────────────────────────────────────────────────────────────────────────┤
│   @vitejs/plugin-vue + vue-jsx ──► 编译 .vue / .jsx                      │
│   unocss/vite + uno.config ──► 原子类 + i-me:/i-fe: 图标 + safelist      │
│   unplugin-auto-import ──► ref/computed/useRoute 等免 import             │
│   unplugin-vue-components + NaiveUiResolver                              │
│   └──► n-* 与 src/components 免注册 (ThemeSetting/TheLogo 也靠它)        │
│   build/plugin-isme/ ──► 虚拟模块(构建期生成)                            │
│    ├ isme:icons ► 图标清单 · isme:page-pathes ► 页面路径清单             │
│    └ 消费方: uno.config safelist · ResAddOrEdit 下拉选择                 │
│   vite-plugin-router-warn ──► 去掉动态路由告警噪音                       │
│   server.proxy /api ──► VITE_PROXY_TARGET · alias @ ► src                │
│   产物: dist/ 静态资源 (chunkSizeWarningLimit 1024kb)                    │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ 构建期把"免 import/免注册/虚拟模块"烧进产物
┌──────────────────────────────────────────────────────────────────────────┐
│ 【运行期框架】package.json dependencies ► main.ts 装配                   │
├──────────────────────────────────────────────────────────────────────────┤
│ Vue 3.5: 应用实例 + 响应式/组合式 API(createApp/computed/watch)          │
│   ├ Vue Router 5: URL ► 组件调度 + 导航闸门(4 守卫 + addRoute)           │
│   ├ Pinia 3 (+persistedstate): 全局唯一事实源，6 个业务模块              │
│   ├ Naive UI 2: 组件库 + createDiscreteApi ► $message/$dialog/           │
│   │   $notification/$loadingBar(无需挂载组件即可调用)                    │
│   └ UnoCSS: 原子样式 + 图标；@arco-design/color 生成主题色板             │
│ 支撑库: axios(HTTP) · @vueuse/core(useDark/useStorage/useFullscreen)     │
│   · lodash-es(cloneDeep) · dayjs(日期) · echarts+vue-echarts(图表)       │
│   · xlsx(MeCrud 导出) · vue3-intro-step(新手引导)                        │
│ 控制链路: 组件事件 ► store action ► 响应式回灌 ► 组件重渲染              │
│         + 路由跳转由 router 接管，两者分工不重叠                         │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ 框架能力最终都收敛到具体消费点
┌──────────────────────────────────────────────────────────────────────────┐
│ 【能力落点】谁提供了什么，被哪个消费点用掉 (可逐条核对)                  │
├──────────────────────────────────────────────────────────────────────────┤
│   ┌────────────────┬────────────────────┬─────────────────────────┐      │
│   │ 能力           │ 提供方             │ 消费点                  │      │
│   ├────────────────┼────────────────────┼─────────────────────────┤      │
│   │ 免 import 函数 │ auto-import        │ 全项目 src/**           │      │
│   │ 组件自动注册   │ vue-components     │ n-* 与 ThemeSetting 等  │      │
│   │ 图标 safelist  │ uno.config         │ 菜单 icon / meta.icon   │      │
│   │ 虚拟模块       │ plugin-isme        │ ResAddOrEdit / unocss   │      │
│   │ 状态持久化     │ persistedstate     │ app / auth / tab        │      │
│   │ 离散 API       │ naiveTools         │ $message / $dialog 全局 │      │
│   │ Excel 导出     │ xlsx               │ MeCrud.handleExport     │      │
│   │ 主题色板       │ @arco-design/color │ app.setThemeColor       │      │
│   └────────────────┴────────────────────┴─────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  图3【运行逻辑架构图】一条代表性链路: 登录 ► 动态路由 ► 首次放行         │
│  回答: 这一圈闭环里 ①②③ 怎么接力，刷新为什么不会丢权限                   │
│  字典: ──► 静态依赖   ╌╌► 运行时连接   ► 步骤链   条件 ──► 结果          │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ ① 用户提交账号密码 (接口免 token)
┌──────────────────────────────────────────────────────────────────────────┐
│ ① 【登录页】views/login/index.vue + views/login/api.ts                   │
├──────────────────────────────────────────────────────────────────────────┤
│ api.login({username,password,captcha}) ──► POST /auth/login (免token)    │
│ code 10003(验证码错) ──► 刷新验证码；成功 ──► authStore.setToken(data)   │
│ auth.setToken ► accessToken 入 store ► 持久化到 localStorage             │
│ 记住我: lStorage.set("loginInfo") + useStorage("isRemember")             │
│ ► router 跳转 route.query.redirect || "/" ╌╌► 触发下一次导航             │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ ② 目标路由未注册 ► 守卫补数据 + 注册路由
┌──────────────────────────────────────────────────────────────────────────┐
│ ② 【权限守卫】router/guards/permission-guard.ts (beforeEach)             │
├──────────────────────────────────────────────────────────────────────────┤
│ 有 token、非 /login、非白名单 ──► 继续；userStore.userInfo 为空(刷新)    │
│ ► Promise.all[getUserInfo(), getPermissions()] 并发取回纯数据            │
│ getUserInfo ──► api.getUser ──► /user/detail ──► userStore.setUser       │
│ getPermissions ──► api.getRolePermissions ⊕ basePermissions              │
│   ──► permissionStore.setPermissions ► 生成 menus + accessRoutes         │
│ ► import.meta.glob("@/views/**/*.vue") 把路径字符串换成懒加载函数        │
│ ► 逐条 router.addRoute(route) (已在则不重复加)                           │
│ ► return {...to, replace:true} ╌╌► 重跑本守卫(第二次直接放行)            │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ ③ 放行后进入渲染链路
┌──────────────────────────────────────────────────────────────────────────┐
│ ③ 【渲染落位】App.vue + layouts/ + tab-guard                             │
├──────────────────────────────────────────────────────────────────────────┤
│ routes.some(r => r.name === to.name) ──► true 放行(已注册合法路由)       │
│   └ 未注册 ──► api.validateMenuPath(to.path)                             │
│      ├ true  ──► /403(有菜单但路由缺失)   └ false ──► /404               │
│ App.vue: Layout = route.meta.layout || appStore.layout ──► 异步骨架      │
│   └ <component :is> + KeepAlive(:include = tabStore 中 keepAlive)        │
│ tab-guard(afterEach) ► tabStore.addTab({name, path, ...})                │
│ page-title(afterEach) ► document.title = meta.title | VITE_TITLE         │
│ page-loading: beforeEach $loadingBar.start → afterEach finish(200ms)     │
└──────────────────────────────────────────────────────────────────────────┘
                               ▲ 撤场时由状态层统一指挥，各层被动清空
                               │
┌──────────────────────────────────────────────────────────────────────────┐
│ 【撤场闭环】authStore.logout() (唯一事实源发令)                          │
├──────────────────────────────────────────────────────────────────────────┤
│ resetLoginState(): ①resetRouter(accessRoutes) 移除动态路由               │
│   ②resetUser ③resetPermission ④resetTabs ⑤resetToken                     │
│ ► toLogin() ──► router.replace({path:"/login", query: route.query})      │
│ 效果: 下一个用户登录时不会看到上一个用户的菜单与路由                     │
└──────────────────────────────────────────────────────────────────────────┘
```

## 四、一览表（每层的输入 → 交付 → 消费方）

| 层             | 输入                                        | 交付                                                                    | 消费方                                          |
| -------------- | ------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| 工程启动层     | `package.json` 脚本 · `.env*`               | 插件链、虚拟模块 `isme:*`、别名 `@/~`、`/api` 代理                      | 构建产物 `dist/`、浏览器 Dev Server             |
| 应用引导层     | `App.vue` · `settings.ts`                   | 装配完成的 app 实例 + 全局 `$message/$dialog/$notification/$loadingBar` | 全部组件与 store                                |
| 路由入口控制层 | 静态路由表 · token · 后端权限数据           | 动态路由表、放行/重定向决策、页面标题、标签写入                         | `App.vue` · permission/user store · tab store   |
| 布局渲染层     | `appStore.layout` · `permissionStore.menus` | 4 套骨架 + 菜单/面包屑/多标签                                           | 页面组件                                        |
| 页面组件层     | 接口函数 · 列配置                           | 业务 UI 与交互                                                          | 用户                                            |
| 业务组件层     | props（columns/getData/queryItems）         | 表格+搜索+分页+导出 / 可拖拽弹窗壳                                      | 页面组件 · 布局组件（RoleSelect/LayoutSetting） |
| 组合逻辑层     | 注入的 api 函数 + refresh 回调              | handleAdd/Edit/View/Save/Delete                                         | 页面 `setup`                                    |
| 状态层         | 后端纯数据 · 用户操作                       | menus/accessRoutes · accessToken · 布局偏好 · tabs                      | 守卫 · 布局 · 请求拦截器                        |
| 网络请求层     | 各模块接口函数                              | Promise（业务码白名单放行 / 错误收敛成中文提示）                        | 页面 · `store/helper` · permission-guard        |
| 基础设施层     | 无（最底层）                                | 存储类、类型判断、格式化、离散 API、全局样式                            | 以上所有层                                      |

### 关键文件速查

| 文件                                | 输入 → 交付 → 消费方                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `vite.config.ts`                    | 环境变量 + 源码 → 插件管线/别名/代理 → Vite 与业务代码                                 |
| `build/index.ts`                    | `globSync` 扫图标与页面 → `getIcons()/getPagePathes()` → 两个自定义插件 + `uno.config` |
| `main.ts`                           | `App.vue` → 装配顺序 → 浏览器 DOM                                                      |
| `App.vue`                           | `route.meta.layout`/tabStore → 异步 Layout + KeepAlive 壳 → 页面组件                   |
| `store/helper.ts`                   | `api.getUser`/`api.getRolePermissions` → 归一化用户与权限 → permission-guard           |
| `router/guards/permission-guard.ts` | token + userInfo → 放行/重定向/注册动态路由 → router                                   |
| `components/me/crud/index.vue`      | `:columns :get-data :query-items` → 表格数据/导出文件 → 4 个列表页                     |
| `composables/useCrud.ts`            | 页面注入的接口函数 → 弹窗+表单+保存闭环 → 页面模板 ref                                 |
| `utils/http/interceptors.ts`        | 请求配置 → 附加 Bearer / 校验业务码 → 所有 api 调用方                                  |
| `utils/http/helpers.ts`             | 错误码 → 中文提示 / 重新登录确认框 → 拦截器                                            |
| `utils/storage/storage.ts`          | key/value/expire → 带前缀与过期机制的读写 → `lStorage/sStorage`（登录页）              |
| `utils/naiveTools.ts`               | Naive UI 组件 → `createDiscreteApi` → `window.$message` 等全局                         |

## 五、值得吃透的设计点

**① 权限只有一条主链，闸门唯一。** `permission-guard` 用一个 `if (!userStore.userInfo)` 就同时解决了三件事：刷新后内存态丢失的**补录**、后端权限 → 前端路由表的**翻译**、以及返回 `{...to, replace:true}` 让守卫**重跑一次**以保证本次导航真的能匹配到路由。理解了这一条，就理解了"为什么刷新页面不会丢权限、也不会白屏"。

**② `useCrud` 是唯一的胶水，组件层与网络层互不认识。** `MeModal` 不知道 axios，`utils/http` 不知道弹窗，二者靠 `useCrud` 在页面 `setup` 里用**运行时 ref 与回调注入**串起来（`useModal` 的 `modalRef` 遥控 `MeModal`、页面把 `api.create` 注入为 `doCreate`）。因此 `composables/` 对 `components/me/` 零 import 依赖——这是本项目最值得复制的解耦手法。

**③ 状态分三档持久化，不是"全都存"。** `auth.accessToken` 走 localStorage（跨标签页保住登录态）；`app` 的布局/主题与 `tab` 的标签页只 `pick` 关键字段到 sessionStorage（关掉标签页就复位）；`user`/`permission` **故意不持久化**，靠守卫每次刷新重新补录——避免把权限数据留在浏览器里被篡改。

**④ 构建期把复杂度前置了。** 免 `import`（auto-import）、免注册（vue-components + NaiveUiResolver，连 `ThemeSetting`/`TheLogo` 都是自动注册）、虚拟模块（`isme:icons`/`isme:page-pathes`）三件事让业务代码几乎没有样板；代价是**符号来源在文件里看不见**，读代码时需要知道这三条链路存在，否则会在 `src/` 里找不到 `ref`、`$message`、`NDataTable` 是从哪来的。

**⑤ 依赖注入点（曾经的破例，已整改）。** 分层规则说"下层不 import 上层"；早期 `utils/http` 曾为取 token 反向依赖 auth store，现改为 `setupHttpAuth()` 注入：应用入口 `main.ts` 在 store 装配后把 `getAccessToken/logout` 两个能力注入 http 层，`utils` 保持零上层依赖，可独立复用。同理 `setupNaiveDiscreteApi` 的主题以 `ComputedRef` 由入口注入。
