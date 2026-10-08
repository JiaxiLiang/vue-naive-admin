// 无需登录即可访问的静态路由（登录/首页/404/403），随路由实例创建即注册；
// 业务页面路由由后端权限驱动，在权限守卫中动态注册
import type { RouteRecordRaw } from 'vue-router'

// satisfies 保留字面量最窄推断，同时校验配置形状符合 RouteRecordRaw
export const basicRoutes = [
  {
    name: 'Login',
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录页',
      layout: 'empty',
    },
  },

  {
    name: 'Home',
    path: '/',
    component: () => import('@/views/home/index.vue'),
    meta: {
      title: '首页',
    },
  },

  {
    name: '404',
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    meta: {
      title: '页面飞走了',
      layout: 'empty',
    },
  },

  {
    name: '403',
    path: '/403',
    component: () => import('@/views/error-page/403.vue'),
    meta: {
      title: '没有权限',
      layout: 'empty',
    },
  },
] satisfies RouteRecordRaw[]
