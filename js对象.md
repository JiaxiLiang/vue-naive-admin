项目核心 JS 数据对象模板字典

1. 用户信息对象 (userInfo)
   来源文件：user.js
   作用：登录成功后存储当前用户的核心信息，全局共享。
   属性列表：
   id (String/Number)：用户唯一标识 ID
   username (String)：用户登录账号
   nickName (String)：用户显示昵称
   avatar (String)：用户头像 URL 地址
   currentRole (Object)：当前激活的角色信息对象（若无则为空对象 {}）
   roles (Array)：用户拥有的所有角色列表数组（若无则为空数组 []）
2. 权限系统相关对象 (核心复杂数据)
   来源文件：permission.js
   作用：处理后端传回来的原始权限数据，并将其转换为前端路由对象和 UI 菜单对象。
   2.1 后端原始权限项对象 (item)
   说明：后端返回的权限树节点，包含菜单和按钮权限。
   属性列表：
   type (String)：权限类型，区分菜单('MENU')或按钮('BUTTON')
   code (String)：权限编码/唯一标识（常用于路由 name）
   name (String)：菜单/按钮的显示名称
   path (String)：路由路径或外部链接
   component (String)：前端组件的文件路径字符串
   redirect (String)：路由重定向路径
   icon (String)：图标类名或标识
   order (Number)：排序权重（数字越小越靠前）
   show (Boolean)：是否在菜单栏中显示
   enable (Boolean)：该路由是否启用并可访问
   keepAlive (Boolean)：页面是否需要缓存
   layout (String)：页面布局模式配置
   children (Array)：子级权限项数组（树形结构套娃）
   2.2 前端路由配置对象 (route)
   说明：由 generateRoute 方法根据后端 item 生成的 Vue Router 标准对象。
   属性列表：
   name (String)：路由名称（取自 item.code）
   path (String)：路由路径
   redirect (String)：重定向配置
   component (String)：组件路径
   meta (Object)：路由元信息对象，包含以下属性：
   originPath (String)：原始路径（主要用于外链备份）
   icon (String)：图标类名（带 ?mask 后缀）
   title (String)：页面标题（取自 item.name）
   layout (String)：布局模式
   keepAlive (Boolean)：是否缓存（强制转布尔值）
   parentKey (String)：父级菜单的 key 标识
   btns (Array)：页面内的按钮权限列表，内部对象包含 code 和 name
   2.3 UI 菜单组件对象 (menuItem)
   说明：由 getMenuItem 方法生成，专门传给侧边栏 UI 组件用于渲染菜单树。
   属性列表：
   label (String)：菜单显示文字（取自 route.meta.title）
   key (String)：菜单唯一标识（取自 route.name）
   path (String)：菜单跳转路径
   originPath (String)：原始路径
   icon (Function)：返回虚拟 DOM 的函数，用于渲染图标（如 () => h('i', {...})）
   order (Number)：排序权重
   children (Array)：子菜单数组（若无则被 delete 删除该属性）
3. 应用全局配置对象 (app state)
   来源文件：app.js
   作用：控制系统全局 UI 状态、主题色、布局模式，并持久化到 sessionStorage。
   属性列表：
   collapsed (Boolean)：侧边栏是否折叠
   isDark (Boolean)：是否开启暗黑模式
   layout (String)：当前系统的布局模式（如侧边、顶部等）
   primaryColor (String)：当前系统的主题主色调（如十六进制颜色码）
   naiveThemeOverrides (Object)：Naive UI 组件库的主题覆盖配置对象，内部包含 common 等配置项用于精细控制组件颜色。
4. 认证令牌对象 (auth data)
   来源文件：auth.js
   作用：接收登录接口返回的 token 数据，并管理全局登录态。
   属性列表：
   accessToken (String)：访问令牌字符串，用于接口请求头鉴权。
