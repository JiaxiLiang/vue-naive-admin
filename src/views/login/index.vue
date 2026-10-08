<template>
  <div class="login-bg wh-full flex-col">
    <div class="m-auto max-w-700 min-w-345 f-c-c rounded-8 bg-white/86 p-12 backdrop-blur-14px card-shadow dark:bg-#18181c/86">
      <div class="hidden w-380 flex-col items-center justify-center rounded-8 from-#2F54EB/8 to-#13C2C2/14 bg-gradient-to-br px-20 py-35 md:flex">
        <h2 class="brand-gradient-text text-40 font-bold">
          Vue Naive Admin
        </h2>
        <p class="mt-12 text-15 opacity-60">
          轻量 · 高效 · 开箱即用的后台解决方案
        </p>
      </div>

      <div class="login-form w-320 flex-col px-20 py-32">
        <h2 class="f-c-c text-24 text-#6a6a6a font-normal dark:text-white">
          <img src="@/assets/images/logo.png" class="mr-12 h-50">
          {{ title }}
        </h2>
        <n-input
          v-model:value="loginInfo.username"
          autofocus
          class="mt-32 h-40 items-center"
          placeholder="请输入用户名"
          :maxlength="20"
        >
          <template #prefix>
            <i class="i-fe:user mr-12 opacity-20" />
          </template>
        </n-input>
        <n-input
          v-model:value="loginInfo.password"
          class="mt-20 h-40 items-center"
          type="password"
          show-password-on="mousedown"
          placeholder="请输入密码"
          :maxlength="20"
          @keydown.enter="handleLogin()"
        >
          <template #prefix>
            <i class="i-fe:lock mr-12 opacity-20" />
          </template>
        </n-input>

        <div class="mt-20 flex items-center">
          <n-input
            v-model:value="loginInfo.captcha"
            class="h-40 flex-1 items-center"
            placeholder="请输入验证码"
            :maxlength="4"
            @keydown.enter="handleLogin()"
          >
            <template #prefix>
              <i class="i-fe:key mr-12 opacity-20" />
            </template>
          </n-input>
          <img
            v-if="captchaUrl"
            :src="captchaUrl"
            alt="验证码"
            height="40"
            class="ml-12 w-80 cursor-pointer rounded-8"
            @click="initCaptcha"
          >
        </div>

        <n-checkbox
          class="mt-20"
          :checked="isRemember"
          label="记住我"
          :on-update:checked="(val) => (isRemember = val)"
        />

        <div class="mt-24 flex items-center gap-12">
          <n-button
            class="h-40 flex-1 rounded-8 text-16"
            type="primary"
            ghost
            @click="quickLogin()"
          >
            一键体验
          </n-button>

          <n-button
            class="login-btn h-40 flex-1 text-16"
            type="primary"
            :loading="loading"
            @click="handleLogin()"
          >
            登录
          </n-button>
        </div>
      </div>
    </div>

    <TheFooter class="py-12" />
  </div>
</template>

<style>
.login-bg {
  background:
    radial-gradient(ellipse 80% 60% at 20% 15%, rgb(47 84 235 / 14%), transparent),
    radial-gradient(ellipse 50% 45% at 85% 80%, rgb(19 194 194 / 12%), transparent),
    linear-gradient(125deg, #eef2ff, #f4f9f8 48%, #eef3ff);
}
.dark .login-bg {
  background: linear-gradient(125deg, #101014, #121a26 55%, #0e1420);
}
.login-btn {
  background: linear-gradient(90deg, #2f54eb, #13c2c2) !important;
  border: none !important;
}
.login-form > * {
  animation: login-fade-up 0.5s ease both;
}
.login-form > *:nth-child(2) {
  animation-delay: 0.08s;
}
.login-form > *:nth-child(3) {
  animation-delay: 0.16s;
}
.login-form > *:nth-child(n + 4) {
  animation-delay: 0.24s;
}
@keyframes login-fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
}
</style>

<script setup lang="ts">
// 登录页：表单校验 → 调用登录接口 → 存 token 到 authStore → 按 redirect 参数或默认路径跳转；
// 支持"记住我"持久化账号密码、图形验证码（错误后自动刷新）与一键体验快捷登录
import type { LoginToken } from '@/types/models'
import { useStorage } from '@vueuse/core'
import { useAuthStore } from '@/store'
import { lStorage, throttle } from '@/utils'
import api from './api'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const title = import.meta.env.VITE_TITLE

const loginInfo = ref({
  username: '',
  password: '',
  captcha: '',
})

// 验证码图片地址：带时间戳绕过浏览器缓存，节流 500ms 防止频繁刷新
const captchaUrl = ref('')
const initCaptcha = throttle(() => {
  captchaUrl.value = `${import.meta.env.VITE_AXIOS_BASE_URL}/auth/captcha?${Date.now()}`
}, 500)

// 回填"记住我"保存的账号密码，并初始化验证码
const localLoginInfo = lStorage.get<{ username?: string, password?: string }>('loginInfo')
if (localLoginInfo) {
  loginInfo.value.username = localLoginInfo.username || ''
  loginInfo.value.password = localLoginInfo.password || ''
}
initCaptcha()

// 一键体验：填入演示账号并跳过验证码直接登录
function quickLogin() {
  loginInfo.value.username = 'admin'
  loginInfo.value.password = '123456'
  handleLogin(true)
}

const isRemember = useStorage('isRemember', true)
const loading = ref(false)
// 提交登录：校验必填项 → 调接口 → 按勾选决定是否记住密码，验证码错误时刷新验证码
async function handleLogin(isQuick?: boolean) {
  const { username, password, captcha } = loginInfo.value
  if (!username || !password)
    return $message.warning('请输入用户名和密码')
  if (!isQuick && !captcha)
    return $message.warning('请输入验证码')
  try {
    loading.value = true
    $message.loading('正在验证，请稍后...', { key: 'login' })
    const { data } = await api.login({ username, password: password.toString(), captcha, isQuick })
    if (isRemember.value) {
      lStorage.set('loginInfo', { username, password })
    }
    else {
      lStorage.remove('loginInfo')
    }
    onLoginSuccess(data)
  }
  catch (error) {
    // 10003 为验证码错误的专属业务码（reject 的是拦截器构造的 RequestError 形状）
    if ((error as { code?: number }).code === 10003) {
      // 刷新验证码，防止用旧验证码爆破重试
      initCaptcha()
    }
    $message.destroy('login')
    console.error(error)
  }
  loading.value = false
}

// 登录成功后续：写入 token，并优先跳回权限守卫记录的原始目标页
async function onLoginSuccess(data: LoginToken) {
  authStore.setToken(data)
  $message.loading('登录中...', { key: 'login' })
  try {
    $message.success('登录成功', { key: 'login' })
    if (route.query.redirect) {
      // redirect 由权限守卫以字符串路径写入，这里只回填其余 query
      const path = route.query.redirect as string
      delete route.query.redirect
      router.push({ path, query: route.query })
    }
    else {
      router.push('/')
    }
  }
  catch (error) {
    console.error(error)
    $message.destroy('login')
  }
}
</script>
