# CRUD 封装体系模块架构图

> 覆盖文件:`src/components/me/{crud,modal}`、`src/composables/*`、`src/utils/http/*`、`src/utils/storage/*`
> 依赖方向:**自上而下**。上层调用下层,下层不反向 import 上层。

## 一、模块依赖全景

```mermaid
flowchart TD
    %% ========== 业务页面层 ==========
    subgraph PAGE["① 业务页面层 src/views/pms/*"]
        VIEW["user / role / resource 页面<br/>只传配置(columns、queryItems)+ 接口函数<br/>(getData / doCreate / doUpdate / doDelete)"]
    end

    %% ========== 组件层 ==========
    subgraph COMP["② 组件层 src/components/me/ (半成品 UI)"]
        CRUD["crud/index.vue · MeCrud<br/>表格+搜索+分页+导出 三位一体<br/>expose: handleSearch / handleReset / handleExport"]
        QITEM["crud/QueryItem.vue · MeQueryItem<br/>搜索项排版小件(label + 定宽内容区)"]
        MODAL["modal/index.vue · MeModal<br/>万能弹窗壳<br/>expose: open / close / handleOk / okLoading"]
        DRAG["modal/utils.ts<br/>initDrag 拖拽(纯 DOM,不依赖 Vue)"]
    end

    %% ========== 逻辑层 ==========
    subgraph HOOK["③ 逻辑层 src/composables/ (交互动作)"]
        IDX["index.ts 桶文件<br/>统一 re-export"]
        USECRUD["useCrud.ts ★ 总装车间<br/>组合 useModal + useForm<br/>handleAdd / Edit / View / Open / Save / Delete"]
        USEMODAL["useModal.ts 弹窗遥控器<br/>modalRef + okLoading(读写代理到 MeModal)"]
        USEFORM["useForm.ts 表单管家<br/>formRef / formModel / validation / rules"]
    end

    %% ========== 网络层 ==========
    subgraph HTTP["④ 网络层 src/utils/http/"]
        AXIDX["index.ts · createAxios<br/>产出 request / mockRequest 两个实例<br/>(baseURL + timeout)"]
        INTC["interceptors.ts · setupInterceptors<br/>请求: 自动附加 Bearer token<br/>响应: 业务码白名单 [0,200] 放行,否则走错误解析"]
        HELP["helpers.ts · resolveResError<br/>401/11007/11008 → 重新登录确认框(防重复锁)<br/>403/404/500 → 中文提示 + $message.error"]
    end

    %% ========== 存储层 ==========
    subgraph STOR["⑤ 存储层 src/utils/storage/"]
        SIDX["index.ts<br/>lStorage / sStorage 实例<br/>统一前缀 vue-naive-admin_"]
        SCLS["storage.ts · Storage 类<br/>getKey / set / get / getItem / remove / clear<br/>自带过期时间机制"]
    end

    %% ========== 外部依赖 ==========
    NAIVE["naive-ui<br/>NDataTable / NModal / NCard ..."]
    XLSX["xlsx<br/>导出 Excel"]
    STORE["store · useAuthStore<br/>accessToken / logout"]
    UTILS["@/utils<br/>isNullOrUndef"]
    BROWSER["浏览器仓库<br/>localStorage / sessionStorage"]
    BACKEND["后端 API"]

    %% ---- 页面 → 组件/逻辑 ----
    VIEW -->|"模板中使用"| CRUD
    VIEW -->|"模板中使用"| QITEM
    VIEW -->|"模板中使用 ref=modalRef"| MODAL
    VIEW -->|"setup 中调用"| USECRUD

    %% ---- 组件内部 ----
    CRUD --> NAIVE
    CRUD --> XLSX
    MODAL --> NAIVE
    MODAL -->|"open() 后初始化拖拽"| DRAG

    %% ---- 逻辑层内部 ----
    IDX -.re-export.- USECRUD
    IDX -.re-export.- USEMODAL
    IDX -.re-export.- USEFORM
    IDX -.re-export.- ALIVE
    USECRUD -->|"组合"| USEMODAL
    USECRUD -->|"组合"| USEFORM
    USEMODAL -.->|"通过 modalRef 遥控<br/>(运行时连接,非 import)"| MODAL
    USEFORM -.->|"通过 formRef 校验<br/>(运行时连接,非 import)"| NAIVE

    %% ---- 页面接口函数 → 网络层 ----
    VIEW -->|"接口函数内部调用"| AXIDX
    AXIDX --> INTC
    INTC --> HELP
    INTC -->|"取 token"| STORE
    HELP -->|"过期时 logout"| STORE
    AXIDX ==>|"请求"| BACKEND

    %% ---- 存储层 ----
    SIDX --> SCLS
    SCLS --> UTILS
    SCLS --> BROWSER
    STORE -.->|"持久化登录态(登录页使用 lStorage)"| SIDX

    style USECRUD fill:#ffe9c7,stroke:#e8a33d
    style VIEW fill:#d8ecd9,stroke:#5a9e6f
    style AXIDX fill:#d9e6f7,stroke:#4a7fb5
    style SIDX fill:#f0ddf0,stroke:#9e5a9e
```

## 二、一次"新增/编辑保存"的运行时数据流

```mermaid
sequenceDiagram
    participant P as 业务页面
    participant C as useCrud
    participant M as MeModal(弹窗壳)
    participant F as NForm(表单)
    participant A as request(axios)
    participant I as 拦截器
    participant B as 后端

    P->>C: handleAdd(row) / handleEdit(row)
    C->>C: modalForm = {...row}(useForm 托管)
    C->>M: modalRef.open({ title, onOk })
    Note over M: open() 合并 props+options<br/>show=true 并 initDrag
    P->>M: 用户在弹窗内填写表单(v-model=modalForm)
    M->>C: 点"确定" → 回调 onOk()
    C->>F: validation()(formRef.validate)
    F-->>C: 校验通过
    C->>C: okLoading = true(经 useModal 代理写入 MeModal)
    C->>A: doCreate / doUpdate(modalForm)
    A->>I: 请求拦截: 附加 Bearer token
    I->>B: 发起请求
    B-->>I: 响应
    alt code ∈ [0, 200]
        I-->>C: resolve(data)
        C->>C: $message.success + okLoading=false
        C->>M: 返回非 false → close()
        C->>P: refresh(data) → MeCrud.handleSearch 刷新列表
    else 业务码异常
        I->>I: resolveResError(code) → $message.error<br/>401 类 → 重新登录确认框
        I-->>C: reject({code, message})
        C->>C: okLoading=false,返回 false(弹窗不关)
    end
```

## 三、各文件职责速查

| 文件                               | 角色                                                | 关键导出                                                   |
| ---------------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `components/me/crud/index.vue`     | 表格+搜索+分页+导出的半成品                         | MeCrud(expose: handleSearch/handleReset/handleExport)      |
| `components/me/crud/QueryItem.vue` | 搜索项排版件                                        | MeQueryItem(label + 定宽插槽)                              |
| `components/me/modal/index.vue`    | 可拖拽万能弹窗壳                                    | MeModal(expose: open/close/handleOk/okLoading)             |
| `components/me/modal/utils.ts`     | 纯 DOM 拖拽实现                                     | initDrag(bar, box)                                         |
| `composables/useCrud.ts`           | ★ 总装:把弹窗+表单+接口+提示+刷新串成标准 CRUD 循环 | useCrud({name, initForm, doCreate/Delete/Update, refresh}) |
| `composables/useForm.ts`           | 表单状态与校验                                      | useForm → [formRef, formModel, validation, rules]          |
| `composables/useModal.ts`          | 用 ref 遥控 MeModal                                 | useModal → [modalRef, okLoading]                           |
| `composables/useAliveData.ts`      | 按路由名缓存组件数据(暂未使用)                      | useAliveData                                               |
| `utils/http/index.ts`              | axios 实例工厂                                      | createAxios / request / mockRequest                        |
| `utils/http/interceptors.ts`       | 请求附 token、响应验业务码                          | setupInterceptors                                          |
| `utils/http/helpers.ts`            | 错误码 → 中文提示 / 重新登录弹窗                    | resolveResError                                            |
| `utils/storage/index.ts`           | 带前缀的存储实例                                    | lStorage / sStorage                                        |
| `utils/storage/storage.ts`         | 存储类(JSON 序列化 + 过期时间)                      | createStorage / Storage                                    |

## 四、设计要点

1. **三层蛋糕**:naive-ui 零件 → components/me 半成品 → views 业务页。业务页只写"配置 + 接口函数",一行 `<MeCrud/>` 出整页。
2. **useCrud 是唯一的"胶水"**:组件层(Modal/Form)和网络层(request)互相不认识,全靠 useCrud 在页面 setup 里把它们串起来;`modalRef → MeModal` 是**运行时 ref 连接**,不是 import 依赖,所以逻辑层与组件层零耦合。
3. **约定优于配置**:MeCrud 约定出参 `{ pageData, total }`、入参 `{ pageNo, pageSize }`;拦截器约定业务成功码 `[0, 200]`;`needToken: false`、`needTip: false` 可在单个请求上关闭默认行为。
4. **错误处理收口在 helpers.ts**:所有 HTTP 异常最终都汇到 `resolveResError`,401/11007/11008 触发带防重复锁的"重新登录"确认框,页面层 catch 里只需 `console.error`。
5. **storage 与 http 是平行基础设施**:两者互不依赖,共同的上游是 `useAuthStore`(token 存取、登录态持久化)。
