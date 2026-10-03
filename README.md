# 1-vue-naive-admin

📐 **[项目架构图全集（14 张 · 基于源码重绘）](docs/arch-overview.md)** · [整体分层架构图（可视化 HTML）](docs/architecture.html) · [Mermaid 源码](docs/architecture.md) · [CRUD 模块架构图](docs/module-architecture.md)

```
1-vue-naive-admin
├─ .editorconfig
├─ .env
├─ .env.development
├─ .env.production
├─ .npmrc
├─ .VSCodeCounter
│  └─ 2026-06-16_20-31-00
│     ├─ details.md
│     ├─ diff-details.md
│     ├─ diff.csv
│     ├─ diff.md
│     ├─ diff.txt
│     ├─ results.csv
│     ├─ results.json
│     ├─ results.md
│     └─ results.txt
├─ build
│  ├─ index.js
│  └─ plugin-isme
│     ├─ icons.js
│     ├─ index.js
│     └─ page-pathes.js
├─ eslint.config.js
├─ index.html
├─ jsconfig.json
├─ LICENSE
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ public
│  └─ favicon.png
├─ src
│  ├─ api
│  │  └─ index.js
│  ├─ App.vue
│  ├─ assets
│  │  ├─ icons
│  │  │  ├─ dynamic-icons.js
│  │  │  ├─ feather
│  │  │  └─ isme
│  │  └─ images
│  ├─ components
│  │  ├─ common
│  │  │  ├─ AppCard.vue
│  │  │  ├─ AppPage.vue
│  │  │  ├─ CommonPage.vue
│  │  │  ├─ index.js
│  │  │  ├─ LayoutSetting.vue
│  │  │  ├─ TheFooter.vue
│  │  │  ├─ TheLogo.vue
│  │  │  ├─ ThemeSetting.vue
│  │  │  └─ ToggleTheme.vue
│  │  ├─ index.js
│  │  └─ me
│  │     ├─ crud
│  │     │  ├─ index.vue
│  │     │  └─ QueryItem.vue
│  │     ├─ index.js
│  │     └─ modal
│  │        ├─ index.vue
│  │        └─ utils.js
│  ├─ composables
│  │  ├─ index.js
│  │  ├─ useAliveData.js
│  │  ├─ useCrud.js
│  │  ├─ useForm.js
│  │  └─ useModal.js
│  ├─ directives
│  │  └─ index.js
│  ├─ layouts
│  │  ├─ components
│  │  │  ├─ BeginnerGuide.vue
│  │  │  ├─ BreadCrumb.vue
│  │  │  ├─ Fullscreen.vue
│  │  │  ├─ index.js
│  │  │  ├─ MenuCollapse.vue
│  │  │  ├─ RoleSelect.vue
│  │  │  ├─ SideLogo.vue
│  │  │  ├─ SideMenu.vue
│  │  │  ├─ tab
│  │  │  │  ├─ ContextMenu.vue
│  │  │  │  └─ index.vue
│  │  │  └─ UserAvatar.vue
│  │  ├─ empty
│  │  │  └─ index.vue
│  │  ├─ full
│  │  │  ├─ header
│  │  │  │  └─ index.vue
│  │  │  ├─ index.vue
│  │  │  └─ sidebar
│  │  │     └─ index.vue
│  │  ├─ normal
│  │  │  ├─ header
│  │  │  │  └─ index.vue
│  │  │  ├─ index.vue
│  │  │  └─ sidebar
│  │  │     └─ index.vue
│  │  └─ simple
│  │     ├─ index.vue
│  │     └─ sidebar
│  │        └─ index.vue
│  ├─ main.js
│  ├─ router
│  │  ├─ basic-routes.js
│  │  ├─ guards
│  │  │  ├─ index.js
│  │  │  ├─ page-loading-guard.js
│  │  │  ├─ page-title-guard.js
│  │  │  ├─ permission-guard.js
│  │  │  └─ tab-guard.js
│  │  └─ index.js
│  ├─ settings.js
│  ├─ store
│  │  ├─ helper.js
│  │  ├─ index.js
│  │  └─ modules
│  │     ├─ app.js
│  │     ├─ auth.js
│  │     ├─ index.js
│  │     ├─ permission.js
│  │     ├─ router.js
│  │     ├─ tab.js
│  │     └─ user.js
│  ├─ styles
│  │  ├─ global.css
│  │  └─ reset.css
│  ├─ utils
│  │  ├─ common.js
│  │  ├─ http
│  │  │  ├─ helpers.js
│  │  │  ├─ index.js
│  │  │  └─ interceptors.js
│  │  ├─ index.js
│  │  ├─ is.js
│  │  ├─ naiveTools.js
│  │  └─ storage
│  │     ├─ index.js
│  │     └─ storage.js
│  └─ views
│     ├─ base
│     │  ├─ index.vue
│     │  ├─ keep-alive.vue
│     │  ├─ test-modal.vue
│     │  ├─ unocss-icon.vue
│     │  └─ unocss.vue
│     ├─ demo
│     │  └─ upload
│     │     └─ index.vue
│     ├─ error-page
│     │  ├─ 403.vue
│     │  └─ 404.vue
│     ├─ home
│     │  └─ index.vue
│     ├─ iframe
│     │  └─ index.vue
│     ├─ login
│     │  ├─ api.js
│     │  └─ index.vue
│     ├─ pms
│     │  ├─ resource
│     │  │  ├─ api.js
│     │  │  ├─ components
│     │  │  │  ├─ MenuTree.vue
│     │  │  │  ├─ QuestionLabel.vue
│     │  │  │  └─ ResAddOrEdit.vue
│     │  │  └─ index.vue
│     │  ├─ role
│     │  │  ├─ api.js
│     │  │  ├─ index.vue
│     │  │  └─ role-user.vue
│     │  └─ user
│     │     ├─ api.js
│     │     └─ index.vue
│     └─ profile
│        ├─ api.js
│        └─ index.vue
├─ uno.config.js
└─ vite.config.js

```
