# vue-naive-admin 项目架构图（基于源码重新梳理）

> 本文档由通读 `src/`、`build/`、`vite.config.ts` 源码后重新绘制，与代码实际实现一一对应。
> 图例：`──▶` 编译期 import 依赖　`-.->` 运行时调用/读写　`==▶` 网络请求

---

## 一、整体分层架构图

```mermaid
flowchart TD
    subgraph BROWSER["🌐 浏览器运行时"]
        direction TB

        subgraph L0["① 入口引导层 · src 根"]
            direction LR
            MAIN["main.ts<br/>bootstrap() 启动编排"]
            APPV["App.vue<br/>根组件 · 主题/布局/KeepAlive 总装"]
            SET["settings.ts<br/>默认布局·主色·基础权限"]
            DIR["directives/index.ts<br/>v-permission / withPermission"]
        end

        subgraph L1["② 页面视图层 · src/views"]
            direction LR
            V_LOGIN["login<br/>登录"]
            V_PMS["pms<br/>user / role / resource"]
            V_PROFILE["profile<br/>个人中心"]
            V_OTHER["home / base / demo<br/>iframe / error-page"]
        end

        subgraph L2["③ 布局层 · src/layouts"]
            direction LR
            L_NORMAL["normal<br/>顶栏+侧栏"]
            L_FULL["full<br/>完整模式"]
            L_SIMPLE["simple<br/>极简模式"]
            L_EMPTY["empty<br/>空白"]
            L_COMP["layouts/components<br/>SideMenu·BreadCrumb·AppTab<br/>UserAvatar·RoleSelect·Fullscreen"]
        end

        subgraph L3["③' 组件层 · src/components"]
            direction LR
            C_COMMON["common<br/>AppPage·AppCard·LayoutSetting<br/>ThemeSetting·ToggleTheme·TheLogo"]
            C_ME["me<br/>MeCrud 表格壳<br/>MeQueryItem 查询件<br/>MeModal 弹窗壳"]
        end

        subgraph L4["④ 组合式逻辑层 · src/composables"]
            direction LR
            K_CRUD["useCrud ★<br/>CRUD 总装胶水"]
            K_MODAL["useModal<br/>弹窗遥控"]
            K_FORM["useForm<br/>表单与校验"]
            K_ALIVE["useAliveData<br/>路由级数据缓存"]
        end

        subgraph L5["⑤ 状态层 · src/store (Pinia)"]
            direction LR
            S_APP["app<br/>布局/暗黑/主色"]
            S_AUTH["auth<br/>accessToken"]
            S_USER["user<br/>userInfo + getters"]
            S_PERM["permission<br/>accessRoutes/menus"]
            S_ROUTER["router<br/>router/route 实例代理"]
            S_TAB["tab<br/>多标签页"]
        end

        subgraph L6["⑥ 路由层 · src/router"]
            direction LR
            R_BASIC["basic-routes<br/>4 条静态路由"]
            R_GUARD["guards ×4<br/>page-loading / permission<br/>page-title / tab"]
        end

        subgraph L7["⑦ 服务接口层"]
            direction LR
            A_GLOBAL["api/index.ts<br/>用户·权限·校验"]
            A_VIEWS["views/**/api.ts<br/>就近拆分接口"]
        end

        subgraph L8["⑧ 基础设施层 · src/utils"]
            direction LR
            U_HTTP["http<br/>axios 实例 + 双向拦截器 + 错误码"]
            U_STORE["storage<br/>lStorage / sStorage"]
            U_TOOL["naiveTools<br/>离散 API 全局化"]
            U_COMMON["common / is<br/>时间·节流·类型判断"]
        end

        subgraph L9["⑨ 构建期 · build + vite.config.ts"]
            direction LR
            B_ICON["plugin-isme/icons<br/>isme:icons 虚拟模块"]
            B_PATH["plugin-isme/page-pathes<br/>isme:page-pathes 虚拟模块"]
            B_AUTO["unplugin-auto-import<br/>vue / vue-router API"]
            B_COMP["unplugin-vue-components<br/>NaiveUiResolver"]
        end
    end

    subgraph EXT["⑩ 外部依赖与后端"]
        direction LR
        D_CORE["Vue 3.5 · Router 5 · Pinia 3"]
        D_UI["Naive UI 2 · UnoCSS · ECharts"]
        D_LIB["axios · @vueuse/core<br/>lodash-es · dayjs · xlsx"]
        BACKEND[("后端服务<br/>VITE_AXIOS_BASE_URL")]
    end

    %% ---- 启动编排 ----
    MAIN -->|"1 setupStore"| L5
    MAIN -->|"2 setupDirectives"| DIR
    MAIN -->|"3 setupRouter (await)"| L6
    MAIN -->|"4 mount"| APPV
    MAIN -->|"5 setupNaiveDiscreteApi"| U_TOOL

    %% ---- App.vue 总装 ----
    APPV --> SET
    APPV --> L5
    APPV -->|"按 route.meta.layout<br/>异步加载 + Map 缓存"| L2
    APPV --> C_COMMON

    %% ---- 视图 ----
    L1 --> L2
    L1 --> L3
    L1 --> L4
    L1 --> L7
    L1 --> DIR

    %% ---- 布局 ----
    L2 --> L5
    L2 --> L_COMP
    L_COMP --> L3
    L_COMP --> L5
    L_COMP --> L7
    L_COMP --> L4

    %% ---- 组件 ----
    C_COMMON --> L5
    C_ME -->|"运行时 ref 连接"| K_CRUD

    %% ---- composables ----
    K_CRUD --> K_MODAL
    K_CRUD --> K_FORM
    K_CRUD -.->|"仅类型/工具"| U_COMMON

    %% ---- 路由与状态 ----
    L6 --> L5
    L6 --> L1
    R_GUARD --> R_BASIC
    R_GUARD --> L5
    R_GUARD --> L7
    R_GUARD --> U_TOOL
    S_AUTH --> L7
    S_PERM --> U_COMMON

    %% ---- 接口 ----
    L7 --> U_HTTP
    L7 -.->|"直接用裸 axios<br/>取 components.json"| D_LIB

    %% ---- 基础设施 ----
    U_HTTP -->|"取 accessToken"| S_AUTH
    U_HTTP -.->|"过期 → logout"| S_AUTH
    U_TOOL --> S_APP
    U_STORE --> U_COMMON
    L5 -->|"persistedstate"| U_STORE

    %% ---- 构建期 ----
    L0 -.-> B_AUTO
    L0 -.-> B_COMP
    L1 -.-> B_PATH
    L1 -.-> B_ICON

    %% ---- 外部 ----
    L5 -.-> D_CORE
    L2 -.-> D_UI
    L3 -.-> D_UI
    L4 -.-> D_LIB
    U_HTTP ==> BACKEND

    classDef entry   fill:#4f46e5,stroke:#312e81,color:#fff
    classDef view    fill:#0ea5e9,stroke:#0369a1,color:#fff
    classDef layout  fill:#06b6d4,stroke:#0e7490,color:#fff
    classDef comp    fill:#10b981,stroke:#047857,color:#fff
    classDef logic   fill:#84cc16,stroke:#4d7c0f,color:#fff
    classDef state   fill:#f59e0b,stroke:#b45309,color:#fff
    classDef route   fill:#f97316,stroke:#c2410c,color:#fff
    classDef api     fill:#ef4444,stroke:#b91c1c,color:#fff
    classDef infra   fill:#64748b,stroke:#334155,color:#fff
    classDef build   fill:#0f766e,stroke:#134e4a,color:#fff
    classDef dep     fill:#a855f7,stroke:#7e22ce,color:#fff

    class MAIN,APPV,SET,DIR entry
    class V_LOGIN,V_PMS,V_PROFILE,V_OTHER view
    class L_NORMAL,L_FULL,L_SIMPLE,L_EMPTY,L_COMP layout
    class C_COMMON,C_ME comp
    class K_CRUD,K_MODAL,K_FORM,K_ALIVE logic
    class S_APP,S_AUTH,S_USER,S_PERM,S_ROUTER,S_TAB state
    class R_BASIC,R_GUARD route
    class A_GLOBAL,A_VIEWS api
    class U_HTTP,U_STORE,U_TOOL,U_COMMON infra
    class B_ICON,B_PATH,B_AUTO,B_COMP build
    class D_CORE,D_UI,D_LIB dep
```

### 分层职责速查

| 层           | 目录                                            | 实际职责                                                                                                                                             |
| ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ① 入口引导   | `main.ts` `App.vue` `settings.ts` `directives/` | 严格按 `setupStore → setupDirectives → setupRouter → mount → setupNaiveDiscreteApi` 装配；`App.vue` 是「主题 + 布局 + 过渡 + KeepAlive」的唯一总装点 |
| ② 页面视图   | `src/views/`                                    | 业务页面只做两件事：写配置（columns / queryItems）+ 写接口函数；权限靠 `withPermission` 声明                                                         |
| ③ 布局       | `src/layouts/`                                  | 4 套壳 `normal / full / simple / empty`，由 `route.meta.layout` 或 `appStore.layout` 决定；框架级导航件集中在 `layouts/components`                   |
| ③' 组件      | `src/components/`                               | `common` 通用 UI 件；`me` 业务「半成品」件（MeCrud 表格壳 / MeModal 弹窗壳 / MeQueryItem 查询件）                                                    |
| ④ 组合式逻辑 | `src/composables/`                              | `useCrud` 是唯一胶水，把「开弹窗→填表→校验→调接口→提示→刷新列表」串成一条循环                                                                        |
| ⑤ 状态       | `src/store/`                                    | 6 个 Pinia 模块；只放**登录态 / 权限 / 布局偏好 / 多标签**这类全局状态，业务列表数据不进 store                                                       |
| ⑥ 路由       | `src/router/`                                   | 仅 4 条静态路由（`/login` `/` `/404` `/403`），其余全部由权限动态 `addRoute` 生成；4 个守卫按序注册                                                  |
| ⑦ 服务接口   | `src/api/index.ts` + `views/**/api.ts`          | 跨模块接口聚合在 `api/index.ts`，模块私有接口就近放 `views/**/api.ts`                                                                                |
| ⑧ 基础设施   | `src/utils/`                                    | axios 实例与拦截器、带过期时间的存储封装、NaiveUI 离散 API 全局化、通用工具                                                                          |
| ⑨ 构建期     | `build/plugin-isme/*` + `vite.config.ts`        | 自研虚拟模块（图标清单、页面路径清单）+ 自动导入 + 组件自动注册                                                                                      |

---

## 二、应用启动时序图

```mermaid
sequenceDiagram
    autonumber
    participant HTML as index.html #app
    participant MAIN as main.ts
    participant ST as setupStore
    participant DI as directives
    participant RT as setupRouter
    participant GD as guards
    participant APP as App.vue
    participant NA as setupNaiveDiscreteApi

    MAIN->>MAIN: import 样式(reset/global/uno.css)
    MAIN->>HTML: createApp(App)
    MAIN->>ST: 1. setupStore(app)
    ST->>ST: createPinia()
    ST->>ST: pinia.use(piniaPluginPersistedstate)
    ST-->>MAIN: 注册完成（实例内暂无数据）
    MAIN->>DI: 2. setupDirectives(app)
    DI-->>MAIN: 注册 v-permission 指令
    MAIN->>RT: 3. await setupRouter(app)
    RT->>RT: app.use(router) 载入 basicRoutes
    RT->>GD: setupRouterGuards(router)
    GD->>GD: page-loading: beforeEach 进度条 / afterEach 结束 / onError
    GD->>GD: permission: beforeEach 鉴权 + 动态路由注册
    GD->>GD: page-title: afterEach 设置 document.title
    GD->>GD: tab: afterEach 写入多标签
    RT-->>MAIN: await 返回
    MAIN->>APP: 4. app.mount('#app')
    APP->>APP: n-config-provider 应用主题/暗黑/语言
    APP->>APP: router-view 解析当前路由
    APP->>APP: 按 meta.layout 异步加载布局壳（Map 缓存）
    APP->>APP: transition + KeepAlive 渲染页面组件
    MAIN->>NA: 5. setupNaiveDiscreteApi()
    NA-->>MAIN: 挂载全局 $message $dialog $loadingBar $notification
```

**启动关键点**

| 序号 | 动作                    | 作用                                                              |
| ---- | ----------------------- | ----------------------------------------------------------------- |
| 1    | `setupStore`            | 仅创建 Pinia 容器并挂上持久化插件，**此时没有任何业务数据**       |
| 2    | `setupDirectives`       | 注册 `v-permission`，权限校验靠读 `route.meta.btns`               |
| 3    | `await setupRouter`     | 唯一 await 点，等路由与 4 个守卫就绪后才 mount，避免首屏闪烁      |
| 4    | `mount`                 | `App.vue` 承担「主题 → 布局 → 过渡 → KeepAlive」四级嵌套          |
| 5    | `setupNaiveDiscreteApi` | 必须在 mount 之后，让 `utils` 与 `store` 都能安全拿到运行期上下文 |

---

## 三、App.vue 四级渲染链路

```mermaid
flowchart TD
    START(["n-config-provider<br/>zhCN / darkTheme / themeOverrides"]) --> RV["router-view 插槽<br/>拿到 Component 与 curRoute"]
    RV --> LG{"route.meta.layout<br/>存在？"}
    LG -->|"meta.layout（例：login/404/403 = empty）"| M1["按 meta.layout 取布局"]
    LG -->|"未声明"| M2["取 appStore.layout<br/>全局布局偏好"]
    M1 --> GC["getLayout(name)<br/>Map 缓存 + defineAsyncComponent<br/>防重复加载闪烁"]
    M2 --> GC
    GC --> TRANS["transition name=fade-slide<br/>mode=out-in appear"]
    TRANS --> KA["KeepAlive :include=keepAliveNames<br/>= tabStore.tabs 中 keepAlive 的 name"]
    KA --> RD{"tabStore.reloading ?"}
    RD -->|"true（正在刷新）"| EMPTY["卸载组件，触发重新挂载"]
    RD -->|"false"| PAGE["component :is=Component<br/>:key=curRoute.fullPath"]
    PAGE --> SLOT(["插槽内容交给布局壳 → 布局渲染页面"])

    TRANS -.->|"依赖 tabStore"| TS["tab store<br/>reloading / tabs"]
    LG -.->|"读取"| AS["app store<br/>layout"]
    KA -.->|"读取"| TS

    classDef s fill:#4f46e5,stroke:#312e81,color:#fff
    classDef n fill:#0ea5e9,stroke:#0369a1,color:#fff
    classDef d fill:#f59e0b,stroke:#b45309,color:#fff
    classDef t fill:#64748b,stroke:#334155,color:#fff
    class START,SLOT s
    class RV,GC,TRANS,KA,PAGE n
    class LG,RD d
    class TS,AS t
```

**要点**

- 布局选择优先级：**`route.meta.layout` > `appStore.layout`**，因此单个页面可强制用 `empty`（登录页、403、404）。
- `layouts` 用 `Map` + `markRaw` 缓存布局组件，避免每次路由变化都重新 `import()` 导致闪烁。
- 刷新单个标签页的原理：`tabStore.reloadTab()` 把 `reloading` 置 `true` 再置回 `false`，配合 `v-if` 强制卸载并重建组件，`keepAlive` 临时摘除以保证重新请求数据。

---

## 四、登录与动态路由注册时序图（项目最核心链路）

```mermaid
sequenceDiagram
    autonumber
    actor U as 用户
    participant L as login/index.vue
    participant API as views/login/api.ts
    participant H as utils/http 拦截器
    participant BE as 后端
    participant GUARD as permission-guard
    participant AS as auth store
    participant PS as permission store
    participant US as user store
    participant R as vue-router

    U->>L: 提交账号密码
    L->>API: api.login({ ... }, { needToken: false })
    API->>H: POST /auth/login
    Note over H: needToken=false → 不附加 Authorization
    H->>BE: 登录请求
    BE-->>H: { code: 0/200, data: { accessToken, ... } }
    H-->>L: 解包 data
    L->>AS: setToken({ accessToken })
    Note over AS: persistedstate 自动写入 localStorage<br/>key: vue-naivue-admin_auth
    L->>L: router.replace(redirect ?? '/')
    L->>GUARD: 触发 beforeEach

    GUARD->>AS: 读 accessToken
    alt 无 Token
        GUARD->>GUARD: 在白名单 /login /404 ？ → 放行
        GUARD-->>U: 否则重定向 /login?redirect=原路径
    end

    GUARD->>US: 判断 userStore.userInfo
    Note over GUARD,US: 刷新页面后 Pinia 内存态已丢失 → 需重新补录
    GUARD->>GUARD: Promise.all([ getUserInfo(), getPermissions() ])

    par 并发补录数据
        GUARD->>API: api.getUser() → GET /user/detail
        API->>BE: 请求
        BE-->>API: 用户档案 / roles / currentRole
        GUARD->>US: setUser(整形后的用户信息)
    and
        GUARD->>API: api.getRolePermissions() → GET /role/permissions/tree
        API->>BE: 请求
        BE-->>API: 后端动态权限树
        Note over GUARD: cloneDeep(basePermissions)<br/>.concat(后端权限)
        GUARD->>PS: setPermissions(权限树)
        PS->>PS: 递归 generateRoute() 生成路由配置
        PS->>PS: 递归 getMenuItem() 生成菜单树并按 order 排序
        Note over PS: 外链路径自动改写为<br/>/iframe/{code} + iframe/index.vue
    end

    GUARD->>GUARD: import.meta.glob('@/views/**/*.vue')
    loop 遍历 accessRoutes
        GUARD->>GUARD: component 字符串 → 真实懒加载组件
        GUARD->>R: !hasRoute(name) && addRoute(route)
    end
    GUARD-->>R: return { ...to, replace: true } 重新触发守卫

    GUARD->>R: 二次进入：getRoutes() 找到同名 → 放行
    R-->>U: 渲染页面
    R->>R: afterEach：设置标题 + 写入多标签
```

### 权限守卫决策树（permission-guard.ts）

```mermaid
flowchart TD
    A(["beforeEach 触发，目标路由 to"]) --> B{"authStore.accessToken<br/>存在？"}
    B -->|"否"| C{"to.path 在白名单<br/>['/login','/404']？"}
    C -->|"是"| P1(["放行"])
    C -->|"否"| R1["重定向 /login<br/>query.redirect = to.path"]

    B -->|"是"| D{"to.path === '/login' ?"}
    D -->|"是"| R2["重定向 /"]
    D -->|"否"| E{"在白名单？"}
    E -->|"是"| P1
    E -->|"否"| F{"userStore.userInfo 存在？"}

    F -->|"否（刷新场景）"| G["Promise.all<br/>getUserInfo + getPermissions"]
    G --> G1["写 userStore.setUser"]
    G --> G2["写 permissionStore.setPermissions<br/>→ 生成 accessRoutes + menus"]
    G2 --> G3["import.meta.glob 扫描 views/**/*.vue"]
    G3 --> G4["逐条 addRoute 注入动态路由"]
    G4 --> R3["return { ...to, replace: true }<br/>重新触发本守卫"]

    F -->|"是"| H{"getRoutes() 中<br/>存在 name === to.name？"}
    H -->|"是"| P1
    H -->|"否"| I["api.validateMenuPath(to.path)<br/>向后端确认菜单是否真实存在"]
    I --> J{"后端 data 为真？"}
    J -->|"是"| R4["跳转 403 无权限页<br/>state.from = 'permission-guard'"]
    J -->|"否"| R5["跳转 404 页面不存在"]

    classDef ok fill:#10b981,stroke:#047857,color:#fff
    classDef bad fill:#ef4444,stroke:#b91c1c,color:#fff
    classDef work fill:#f59e0b,stroke:#b45309,color:#fff
    class P1 ok
    class R1,R2,R3,R4,R5 bad
    class G,G1,G2,G3,G4,H,I,J work
```

---

## 五、权限数据模型与三类权限项

```mermaid
flowchart LR
    subgraph SRC["权限数据来源"]
        S1["settings.ts · basePermissions<br/>本地内置（外链/文档类菜单）"]
        S2["GET /role/permissions/tree<br/>后端按当前角色下发的权限树"]
    end

    S1 --> MERGE["getPermissions()<br/>cloneDeep(basePermissions)<br/>.concat(后端权限)"]
    S2 --> MERGE
    MERGE --> TREE["permission store · permissions<br/>原始权限树（深拷贝，不污染 settings）"]

    TREE --> FILTER{{"item.type === 'MENU' ?"}}
    FILTER -->|"是"| MENUBUILD["getMenuItem() 递归<br/>生成菜单树 menus<br/>按 order 升序排序<br/>show=false 的置 null 剔除"]
    FILTER -->|"type === 'BUTTON'"| BTN["generateRoute() 内过滤<br/>→ meta.btns = [{code,name}]"]

    MENUBUILD --> MENUOUT{{"item.show === false ?"}}
    MENUOUT -->|"是"| DROP["返回 null，该菜单不渲染"]
    MENUOUT -->|"否"| MENUOK["挂到左侧菜单 SideMenu"]
    MENUBUILD --> EXTCHK{"item.path 是外链？"}
    EXTCHK -->|"是"| REWRITE["改写：<br/>path = /iframe/{hyphenate(code)}<br/>component = iframe/index.vue<br/>meta.originPath = 原始链接"]
    EXTCHK -->|"否"| PASSTHRU["保留原 path"]

    MENUBUILD --> ROUTEBUILD["accessRoutes.push(route)"]
    PASSTHRU --> ROUTEBUILD
    REWRITE --> ROUTEBUILD

    ROUTEBUILD --> META["路由 meta 结构"]
    META --> M1["title 页面标题<br/>（供 document.title 与面包屑）"]
    META --> M2["icon 图标类名 + ?mask"]
    META --> M3["layout 布局模式"]
    META --> M4["keepAlive 是否缓存"]
    META --> M5["parentKey 父菜单 key"]
    META --> M6["btns 按钮级权限码"]

    BTN --> BTNUSE["v-permission 指令<br/>读 route.meta.btns[].code<br/>不匹配则 el.remove()"]
    BTNUSE --> BTNUSE2["withPermission(vnode, code)<br/>用于 JSX / h() 渲染函数"]

    classDef s fill:#0ea5e9,stroke:#0369a1,color:#fff
    classDef p fill:#f59e0b,stroke:#b45309,color:#fff
    classDef m fill:#10b981,stroke:#047857,color:#fff
    classDef b fill:#ef4444,stroke:#b91c1c,color:#fff
    class S1,S2,MERGE,TREE s
    class FILTER,MENUBUILD,EXTCHK,ROUTEBUILD,META,MENUOUT p
    class MENUOK,DROP,REWRITE,PASSTHRU,M1,M2,M3,M4,M5,M6 m
    class BTN,BTNUSE,BTNUSE2 b
```

| 权限类型 | `type`                    | 落地位置                                                  | 消费方                                                 |
| -------- | ------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| 菜单     | `MENU`                    | `permission.menus` + `accessRoutes`                       | `SideMenu.vue` 渲染左侧导航；`addRoute` 注册可访问路由 |
| 按钮     | `BUTTON`                  | `route.meta.btns`（只取 `code`）                          | `v-permission` 指令 / `withPermission()`               |
| 外链     | `MENU` 且 path 为 http(s) | 自动改写为 `/iframe/{code}`，`meta.originPath` 保留原地址 | `views/iframe/index.vue` 内嵌渲染                      |

---

## 六、状态层（Pinia）模块全景与持久化策略

```mermaid
flowchart TD
    PINIA["pinia 根实例<br/>+ pinia-plugin-persistedstate"]

    subgraph PERSIST["✅ 持久化模块"]
        PA["app<br/>collapsed / layout<br/>primaryColor / naiveThemeOverrides"]
        PT["tab<br/>tabs / activeTab / reloading"]
        PAuth["auth<br/>accessToken<br/>key = vue-naivue-admin_auth"]
    end

    subgraph VOLATILE["⛔ 纯内存模块（刷新即失，靠守卫补录）"]
        VU["user<br/>userInfo + 6 个 getters<br/>userId/username/nickName<br/>avatar/currentRole/roles"]
        VP["permission<br/>accessRoutes / permissions / menus"]
        VR["router<br/>router / route 实例代理<br/>resetRouter(accessRoutes)"]
    end

    PINIA --> PA
    PINIA --> PT
    PINIA --> PAuth
    PINIA --> VU
    PINIA --> VP
    PINIA --> VR

    PAuth -.->|"logout / switchCurrentRole"| RESET{{"auth.resetLoginState() ★ 登出总闸"}}
    RESET --> R1["resetRouter(accessRoutes)<br/>逐条 removeRoute"]
    RESET --> R2["resetUser()<br/>$reset"]
    RESET --> R3["resetPermission()<br/>$reset"]
    RESET --> R4["resetTabs()<br/>$reset"]
    RESET --> R5["resetToken()<br/>$reset"]

    PA --> STORAGE["lStorage / sStorage<br/>Storage 类：JSON 序列化<br/>带 expire 过期时间<br/>key 自动 toLowerCase + 前缀"]
    PT --> STORAGE
    PAuth --> STORAGE

    classDef okHub fill:#10b981,stroke:#047857,color:#fff
    classDef noHub fill:#94a3b8,stroke:#475569,color:#fff
    classDef hubHub fill:#f59e0b,stroke:#b45309,color:#fff
    classDef stHub fill:#64748b,stroke:#334155,color:#fff
    class PINIA,RESET hubHub
    class PA,PT,PAuth okHub
    class VU,VP,VR noHub
    class R1,R2,R3,R4,R5,STORAGE stHub
```

### Store 模块对照表

| 模块         | 写法           | State                                                                       | Getters                                                       | 关键 Actions                                                                                                   | 持久化                         |
| ------------ | -------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `app`        | options        | `collapsed` `isDark`(useDark) `layout` `primaryColor` `naiveThemeOverrides` | —                                                             | `switchCollapsed` `setCollapsed` `toggleDark` `setLayout` `setPrimaryColor` `setThemeColor`                    | ✅ sessionStorage，pick 4 字段 |
| `auth`       | options        | `accessToken`                                                               | —                                                             | `setToken` `resetToken` `toLogin` `switchCurrentRole` `resetLoginState` `logout`                               | ✅ key `vue-naivue-admin_auth` |
| `user`       | options        | `userInfo`                                                                  | `userId` `username` `nickName` `avatar` `currentRole` `roles` | `setUser` `resetUser`                                                                                          | ⛔ 不持久化                    |
| `permission` | options        | `accessRoutes` `permissions` `menus`                                        | —                                                             | `setPermissions` `getMenuItem`(递归) `generateRoute` `resetPermission`                                         | ⛔ 不持久化                    |
| `router`     | **setup 语法** | `router` `route`（来自 `useRouter/useRoute`）                               | —                                                             | `resetRouter(accessRoutes)`                                                                                    | ⛔ 不持久化                    |
| `tab`        | options        | `tabs` `activeTab` `reloading`                                              | `activeIndex`                                                 | `setActiveTab` `setTabs` `addTab` `reloadTab` `removeTab` `removeOther` `removeLeft` `removeRight` `resetTabs` | ✅                             |

**设计约束（源码可验证）**

1. `user` / `permission` 不持久化是**刻意为之**：敏感信息与动态路由表不应落盘，刷新后由 `permission-guard` 通过 `Promise.all` 重新补录。
2. `app` 用 `sessionStorage`，关掉浏览器即失效；`auth` 用默认 `localStorage`，保证「记住登录态」。
3. `resetLoginState()` 是唯一的登出总闸，串起 5 个模块的重置，避免残留脏路由。

---

## 七、路由守卫注册顺序与职责

```mermaid
flowchart LR
    SETUP["setupRouterGuards(router)<br/>src/router/guards/index.ts"]

    SETUP --> G1
    SETUP --> G2
    SETUP --> G3
    SETUP --> G4

    G1["① page-loading-guard<br/>── 钩子"]
    G2["② permission-guard<br/>── 钩子"]
    G3["③ page-title-guard<br/>── 钩子"]
    G4["④ tab-guard<br/>── 钩子"]

    G1 --> G1A["beforeEach → $loadingBar.start()"]
    G1 --> G1B["afterEach → 延迟 200ms finish()"]
    G1 --> G1C["onError → $loadingBar.error()"]

    G2 --> G2A["beforeEach<br/>鉴权 + 动态路由注册<br/>（最重的守卫）"]

    G3 --> G3A["afterEach<br/>document.title<br/>= meta.title + ' │ ' + VITE_TITLE"]

    G4 --> G4A["afterEach<br/>黑名单 EXCLUDE_TAB<br/>['/404','/403','/login'] 跳过<br/>否则 tabStore.addTab({name,fullPath,title,icon,keepAlive})"]

    classDef h fill:#4f46e5,stroke:#312e81,color:#fff
    classDef b fill:#0ea5e9,stroke:#0369a1,color:#fff
    class SETUP h
    class G1,G2,G3,G4 b
```

**关键顺序原因**：`permission-guard` 必须先于 `page-title` 与 `tab` 完成，因为它会 `addRoute` 并 `replace` 重入。若标题与标签先写入，重入时 `to.meta` 可能还是空的。

---

## 八、业务页面「配置 + 接口」极简模式（以 pms/user 为例）

```mermaid
flowchart LR
    subgraph PAGE["views/pms/user/index.vue（业务页）"]
        P1["配置 columns<br/>表格列定义"]
        P2["配置 queryItems<br/>查询条件定义"]
        P3["接口函数<br/>getData / doCreate<br/>doUpdate / doDelete"]
        P4["&lt;MeCrud&gt; 一行出整页"]
        P5["&lt;MeModal ref=modalRef&gt;<br/>&lt;MeQueryItem&gt; 插槽"]
    end

    P1 --> CRUDP["MeCrud 表格壳<br/>expose: handleSearch<br/>handleReset / handleExport"]
    P2 --> QITEM["MeQueryItem 查询件"]
    P3 --> CRUDL["useCrud 胶水"]
    P4 --> CRUDP
    P5 --> MODAL["MeModal 弹窗壳<br/>expose: open / close<br/>okLoading"]

    CRUDL -.->|"ref 遥控"| MODAL
    CRUDL -->|"formRef 校验"| NAIVE["Naive UI<br/>NForm / NDataTable"]
    CRUDP --> NAIVE
    CRUDP -->|"导出 Excel"| XLSX["xlsx"]
    MODAL -->|"open() 后"| DRAG["modal/utils.ts<br/>initDrag 纯 DOM 拖拽"]

    P3 ==>|"走 request 实例"| HTTP["utils/http 拦截器"]
    P3 --> A1["views/pms/user/api.ts"]

    classDef pg fill:#0ea5e9,stroke:#0369a1,color:#fff
    classDef cp fill:#10b981,stroke:#047857,color:#fff
    classDef lg fill:#84cc16,stroke:#4d7c0f,color:#fff
    classDef nf fill:#64748b,stroke:#334155,color:#fff
    class P1,P2,P3,P4,P5 pg
    class CRUDP,QITEM,MODAL,DRAG cp
    class CRUDL lg
    class NAIVE,XLSX,HTTP,A1 nf
```

**MeCrud 内部约定**

| 项   | 约定                                          |
| ---- | --------------------------------------------- |
| 入参 | `{ pageNo, pageSize }`（`pageSize` 默认 10）  |
| 出参 | `{ pageData, total }`                         |
| 搜索 | `handleSearch(keepCurrentPage = false)`       |
| 重置 | `handleReset()`                               |
| 导出 | `handleExport(columns?, data?)` → xlsx 写文件 |

---

## 九、一次「新增/编辑保存」的完整数据流

```mermaid
sequenceDiagram
    autonumber
    actor U as 用户
    participant V as 业务页面
    participant C as useCrud
    participant M as MeModal
    participant F as NForm
    participant A as request(axios)
    participant I as 拦截器
    participant H as resolveResError
    participant B as 后端
    participant T as MeCrud 表格

    U->>V: 点「新增」/「编辑」行
    V->>C: handleAdd(row) / handleEdit(row)
    C->>C: modalAction = 'add' \| 'edit' \| 'view'
    C->>C: modalForm = cloneDeep(initForm) 合并 row
    C->>M: modalRef.open({ title, onOk })
    Note over M: open() 合并 props + options<br/>show = true → initDrag() 开启拖拽
    U->>F: 在弹窗内填写表单（v-model = modalForm）

    U->>M: 点「确定」
    M->>C: await onOk() → handleSave()
    alt action === 'view'
        C-->>M: return false（只读模式不提交）
    end
    C->>F: await validation() → formRef.validate()
    F-->>C: 通过
    C->>C: okLoading = true（经 useModal computed 代理写入 MeModal）
    C->>A: doCreate(modalForm) / doUpdate(modalForm)
    A->>I: 请求拦截：needToken!==false → 附加 Bearer accessToken
    I->>B: 发起 HTTP 请求
    B-->>I: 响应

    alt 业务码 code ∈ [0, 200]
        I-->>C: resolve(data)
        C->>C: $message.success('新增/保存成功')
        C->>M: 返回非 false → 关闭弹窗
        C->>T: refresh(data) → MeCrud.handleSearch() 重新查列表
    else 业务码异常
        I->>H: resolveResError(code, message, needTip)
        alt code ∈ 401 / 11007 / 11008
            H->>H: isConfirming 防重复锁 → $dialog.confirm
            H->>U: 询问「登录已过期，是否重新登录？」
            U->>B: 确认 → authStore.logout() → 重置 5 个 store → 回 /login
        else 其他错误码
            H->>U: 映射中文文案 → window.$message.error
        end
        I-->>C: reject({ code, message, error })
        C->>C: catch：console.error + okLoading = false
        C-->>M: return false（弹窗保持打开，不丢表单）
    end
```

---

## 十、HTTP 层：实例、拦截器与错误码收口

```mermaid
flowchart TD
    ENVCONF["环境变量<br/>dev: VITE_AXIOS_BASE_URL=/api<br/>       VITE_PROXY_TARGET=http://localhost:8085<br/>prod: VITE_AXIOS_BASE_URL=apifox 云端 mock"]

    ENVCONF --> FACTORY

    subgraph FACTORY["utils/http/index.ts · createAxios(options)"]
        DEF["默认配置<br/>baseURL = VITE_AXIOS_BASE_URL<br/>timeout = 12000"]
        MK["axios.create({ ...默认, ...自定义 })"]
        SI["立即调用 setupInterceptors(service)"]
        DEF --> MK --> SI
    end

    FACTORY --> REQ["export const request = createAxios()<br/>★ 全项目唯一正式实例"]
    FACTORY --> MOCK["export const mockRequest<br/>= createAxios({ baseURL: '/mock-api' })"]

    subgraph INT["utils/http/interceptors.ts · 双向拦截器"]
        direction TB
        RQ["请求拦截 reqResolve<br/>needToken === false → 原样返回<br/>否则 Authorization: Bearer {accessToken}"]
        RS["响应拦截 resResolve<br/>content-type 含 json 才走业务码分支<br/>SUCCESS_CODES = [0, 200] → Promise.resolve(data)<br/>非成功 → resolveResError → Promise.reject"]
        REJ["错误拦截 resReject<br/>无 response（网络层错）→ 直接 reject<br/>有 response → 取 data.code ?? status → resolveResError"]
    end

    SI --> RQ
    SI --> RS
    SI --> REJ
    RQ -->|"读 accessToken"| AUTH["auth store"]
    RS --> HELP
    REJ --> HELP

    subgraph HELP["utils/http/helpers.ts · 错误码收口"]
        direction TB
        H1["401 / 11007 / 11008<br/>handleAuthExpired：isConfirming 防重锁<br/>$dialog.confirm → 确认后 authStore.logout()"]
        H2["403 → 请求被拒绝<br/>404 → 请求资源或接口不存在<br/>500 → 服务器发生异常"]
        H3["其他 → 原文案或「{code} 未知异常!」"]
        H4["needTip !== false<br/>→ window.$message.error(message)"]
    end

    HELP --> AUTH
    REQ ==> BACKEND[("后端服务")]
    REQ --> MOCKREQ(["mockRequest → /mock-api"])

    classDef envHub fill:#0f766e,stroke:#134e4a,color:#fff
    classDef facHub fill:#4f46e5,stroke:#312e81,color:#fff
    classDef intHub fill:#f59e0b,stroke:#b45309,color:#fff
    classDef hlpHub fill:#ef4444,stroke:#b91c1c,color:#fff
    class ENVCONF envHub
    class DEF,MK,SI,REQ,MOCK,AUTH,MOCKREQ facHub
    class RQ,RS,REJ intHub
    class HELP,H1,H2,H3,H4 hlpHub
    class AUTH,MOCKREQ fac
```

### 错误码 → 行为对照表

| code              | 行为                                                      | 是否弹提示       |
| ----------------- | --------------------------------------------------------- | ---------------- |
| `0` / `200`       | 视为成功，解包 `data` 直接 resolve                        | —                |
| `401`             | 弹「登录已过期，是否重新登录？」确认框，确认后 `logout()` | 确认框           |
| `11007` / `11008` | 同 401，文案携带后端 `message`                            | 确认框           |
| `403`             | 映射为「请求被拒绝」                                      | `$message.error` |
| `404`             | 映射为「请求资源或接口不存在」                            | `$message.error` |
| `500`             | 映射为「服务器发生异常」                                  | `$message.error` |
| 其他              | 用后端文案，兜底「`{code}` 未知异常!」                    | `$message.error` |

**单请求级开关**：`{ needToken: false }` 跳过 token（如 `login/api.ts` 的登录接口）；`{ needTip: false }` 静默失败（如 `api.logout()`）。

---

## 十一、构建链路与虚拟模块

```mermaid
flowchart TB
    subgraph CFG["vite.config.ts"]
        LOAD["loadEnv(mode, cwd)<br/>读出 VITE_PUBLIC_PATH / VITE_PROXY_TARGET"]
        BASE["base = VITE_PUBLIC_PATH || '/'"]
        PLUGINS["插件数组（按序）"]
        ALIAS["resolve.alias<br/>@ → src<br/>~ → 项目根"]
        DEV["server: port 3200, host 0.0.0.0<br/>proxy /api → VITE_PROXY_TARGET<br/>rewrite 去掉 /api 前缀<br/>proxyRes 注入 x-real-url 响应头"]
        BUILD["build.chunkSizeWarningLimit = 1024"]
        OD["optimizeDeps.include: ['vue3-intro-step']"]
    end

    subgraph PLUG["插件链"]
        P1["@vitejs/plugin-vue<br/>SFC 编译"]
        P2["@vitejs/plugin-vue-jsx<br/>JSX / render 函数"]
        P3["vite-plugin-vue-devtools"]
        P4["unocss/vite<br/>原子化 CSS"]
        P5["unplugin-auto-import<br/>自动注入 vue / vue-router 的 API<br/>（故 store/router 中可直接用 ref、computed、<br/>useRoute、nextTick、unref、h）"]
        P6["unplugin-vue-components<br/>NaiveUiResolver 自动注册 N* 组件"]
        P7["★ build/plugin-isme/page-pathes.ts<br/>glob('src/views/**/*.vue')<br/>→ 虚拟模块 'isme:page-pathes'"]
        P8["★ build/plugin-isme/icons.ts<br/>glob('src/assets/icons/feather/*.svg')<br/>glob('src/assets/icons/isme/*.svg')<br/>+ dynamic-icons.ts<br/>→ 虚拟模块 'isme:icons'"]
        P9["vite-plugin-router-warn<br/>消除动态路由的 No match 噪音"]
    end

    subgraph RES["产出的能力"]
        R1["vite 直接消费<br/>src/**"]
        R2["virtual: isme:page-pathes<br/>页面路径清单数组"]
        R3["virtual: isme:icons<br/>i-fe:* / i-me:* 图标类名数组"]
        R4["UnoCSS 生成的 uno.css<br/>（main.ts 中 import 'uno.css'）"]
        R5["构建产物 dist/<br/>Hash 模式(dev) / History 模式(prod)"]
    end

    LOAD --> BASE
    LOAD --> DEV
    CFG --> PLUGINS
    P1 --> R1
    P2 --> R1
    P4 --> R4
    P5 --> R1
    P6 --> R1
    P7 --> R2
    P8 --> R3
    P9 --> R1
    P2 --> R5
    P1 --> R5
    ALIAS --> R1
    R4 --> R1
    BUILD --> R5
    OD --> R5

    classDef c fill:#4f46e5,stroke:#312e81,color:#fff
    classDef p fill:#0f766e,stroke:#134e4a,color:#fff
    classDef star fill:#f59e0b,stroke:#b45309,color:#fff
    classDef r fill:#10b981,stroke:#047857,color:#fff
    class LOAD,BASE,PLUGINS,ALIAS,DEV,BUILD,OD,CFG c
    class P1,P2,P3,P4,P5,P6,P9 p
    class P7,P8 star
    class R1,R2,R3,R4,R5 r
```

---

## 十二、目录 → 模块对照地图

```mermaid
flowchart LR
    ROOT["vue-naive-admin/"]

    ROOT --> CFG["配置层<br/>vite.config.ts · uno.config.ts<br/>eslint.config.ts · jsconfig.json<br/>.env · .env.development · .env.production"]
    ROOT --> BUILD["自研构建层<br/>build/index.ts<br/>build/plugin-isme/{icons,page-pathes}.js"]
    ROOT --> PUB["静态资源<br/>public/favicon.png"]
    ROOT --> SRC["src/"]

    SRC --> S_MAIN["入口<br/>main.ts · App.vue · settings.ts"]
    SRC --> S_DIR["指令<br/>directives/index.ts"]
    SRC --> S_LAY["布局<br/>layouts/{normal,full,simple,empty}<br/>layouts/components/{SideMenu,BreadCrumb,<br/>tab/index,tab/ContextMenu,UserAvatar,<br/>RoleSelect,Fullscreen,MenuCollapse,<br/>SideLogo,BeginnerGuide}"]
    SRC --> S_VW["视图<br/>views/{login,home,pms/{user,role,resource},<br/>profile,base,demo/upload,iframe,error-page}"]
    SRC --> S_CP["组件<br/>components/common/{AppPage,AppCard,CommonPage,<br/>LayoutSetting,ThemeSetting,ToggleTheme,<br/>TheLogo,TheFooter}<br/>components/me/{crud/index,crud/QueryItem,<br/>modal/index,modal/utils}"]
    SRC --> S_HO["组合式逻辑<br/>composables/{useCrud,useForm,<br/>useModal,useAliveData}"]
    SRC --> S_ST["状态<br/>store/{index,helper}<br/>store/modules/{app,auth,user,permission,router,tab}"]
    SRC --> S_RT["路由<br/>router/{index,basic-routes}<br/>router/guards/{index,permission-guard,<br/>tab-guard,page-title-guard,page-loading-guard}"]
    SRC --> S_AP["接口<br/>api/index.ts<br/>views/**/api.ts（就近拆分）"]
    SRC --> S_UT["工具<br/>utils/{index,common,is,naiveTools}<br/>utils/http/{index,interceptors,helpers}<br/>utils/storage/{index,storage}"]
    SRC --> S_STY["样式与资源<br/>styles/{reset.css,global.css}<br/>assets/icons/{feather,isme,dynamic-icons.ts}<br/>assets/images/"]

    S_MAIN --> S_ST
    S_MAIN --> S_DIR
    S_MAIN --> S_RT
    S_MAIN --> S_UT
    S_MAIN --> S_STY
    S_RT --> S_ST
    S_RT --> S_VW
    S_RT --> S_AP
    S_VW --> S_CP
    S_VW --> S_HO
    S_VW --> S_AP
    S_CP --> S_HO
    S_LAY --> S_CP
    S_AP --> S_UT
    S_ST --> S_AP
    S_UT --> S_ST

    classDef cfgLayer fill:#4f46e5,stroke:#312e81,color:#fff
    classDef blLayer fill:#0f766e,stroke:#134e4a,color:#fff
    classDef coreLayer fill:#f59e0b,stroke:#b45309,color:#fff
    classDef uiLayer fill:#0ea5e9,stroke:#0369a1,color:#fff
    classDef lgLayer fill:#84cc16,stroke:#4d7c0f,color:#fff
    classDef stLayer fill:#10b981,stroke:#047857,color:#fff
    classDef rtLayer fill:#f97316,stroke:#c2410c,color:#fff
    classDef apLayer fill:#ef4444,stroke:#b91c1c,color:#fff
    classDef utLayer fill:#64748b,stroke:#334155,color:#fff
    class CFG,ROOT cfgLayer
    class BUILD blLayer
    class S_MAIN,S_DIR,S_LAY,S_VW,S_CP coreLayer
    class S_HO lgLayer
    class S_ST stLayer
    class S_RT rtLayer
    class S_AP apLayer
    class S_UT,PUB,S_STY utLayer
```

### 关键依赖规则（源码可验证）

1. **单向依赖**：`views → layouts/components → components → composables → store → api → utils`，禁止反向 import。
2. **逻辑层与组件层零耦合**：`useModal` / `useForm` 通过 **ref 运行时遥控** `MeModal` / `NForm`，而不是 import 它们；只有 `useCrud` 在页面 setup 里把两端接起来。
3. **守卫只读 store**：`router` 是骨架层，`permission-guard` 读 `auth/user/permission`，store 不 import router（`router` store 只是把 `useRouter()` 结果包一层）。
4. **store 不放业务数据**：只有登录态、权限、布局偏好、多标签四类全局状态入 store，列表数据全部留在页面 `ref` 中。
5. **接口就近存放**：模块私有接口写 `views/**/api.ts`，跨模块共享（用户详情、权限树、菜单校验）才进 `api/index.ts`。
6. **错误处理单点收口**：所有 HTTP 异常最终汇入 `resolveResError`，页面层 `catch` 只需 `console.error`。

---

## 十三、构建期 vs 运行期：能力来源一览

| 能力                                                                                   | 来源                                                                         | 生效时机                         | 使用方                           |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------- | -------------------------------- |
| `ref` `computed` `watch` `h` `unref` `markRaw` `defineAsyncComponent` `withDirectives` | `unplugin-auto-import`（`vue`）                                              | 构建期注入                       | 全项目免 import                  |
| `useRoute` `useRouter`                                                                 | `unplugin-auto-import`（`vue-router`）                                       | 构建期注入                       | `store/modules/router.ts`、组件  |
| `nextTick`                                                                             | `unplugin-auto-import`（`vue`）                                              | 构建期注入                       | `auth` / `tab` store             |
| `NButton` `NDataTable` `NForm` 等                                                      | `unplugin-vue-components` + `NaiveUiResolver`                                | 构建期按模板标签自动注册         | 所有 `.vue`                      |
| `i-fe:*` `i-me:*` `i-simple-icons:*`                                                   | `build/plugin-isme/icons.ts` 虚拟模块 + UnoCSS                               | 构建期生成类名数组               | 菜单图标、后端下发的 `icon` 字段 |
| 页面路径清单                                                                           | `build/plugin-isme/page-pathes.ts` 虚拟模块                                  | 构建期 glob `src/views/**/*.vue` | 组件选择器 / 路径校验类需求      |
| `$message` `$dialog` `$loadingBar` `$notification`                                     | `utils/naiveTools.ts` 的 `setupNaiveDiscreteApi()`                           | **运行期**挂在 `window` 上       | 拦截器、`useCrud`、各守卫        |
| 路由历史模式（Hash / History）                                                         | `.env.development` = `true` / `.env.production` = `false`                    | 构建期由 `import.meta.env` 决定  | `router/index.ts`                |
| 接口 baseURL                                                                           | `.env.development` = `/api`（走 Vite 代理）/ `.env.production` = apifox mock | 构建期注入                       | `utils/http/index.ts`            |

---

## 十四、架构要点总结

1. **单一入口单线装配**：`main.ts` 用 5 步固定顺序启动，唯一 `await` 在 `setupRouter`，保证守卫就绪后才渲染。
2. **静态极简 + 动态补全**：只写死 4 条公开路由，其余由后端权限树递归生成 `accessRoutes` 并 `addRoute`，实现「菜单、路由、按钮三级权限同源」。
3. **刷新即重建**：Pinia 内存态丢失是设计的一部分，守卫的 `Promise.all` + `replace: true` 重入构成完整的「查票 → 过闸 → 补录」闭环。
4. **App.vue 是唯一总装点**：主题、布局、过渡动画、KeepAlive 四件事集中在根组件，页面层完全不感知。
5. **业务页只写配置**：`columns` + `queryItems` + 5 个接口函数，配合 `useCrud` 就能出一整个 CRUD 页面，页面代码量被压到最低。
6. **基础设施平行且互不依赖**：`utils/http` 与 `utils/storage` 是两条平行线，共同的上游只有 `auth store`（token 与登录态）。
7. **错误与提示单点收口**：拦截器 → `resolveResError` 统一映射中文文案，401 类集中处理登出，页面层不写重复的错误分支。
