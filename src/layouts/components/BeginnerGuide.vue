<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <i
        class="i-fe:beginner mr-16 cursor-pointer text-20"
        @click="show = true"
      />
    </template>
    操作指引
  </n-tooltip>

  <Vue3IntroStep
    ref="myIntroStep"
    v-model:show="show"
    :config="config"
  >
    <template #prev="{ tipItem, index }">
      <NButton class="mr-12" type="primary" color="#fff" text-color="#fff" ghost round size="small" @click="prev(tipItem, index)">
        上一步
      </NButton>
    </template>
    <template #next="{ tipItem }">
      <NButton class="mr-12" type="primary" color="#fff" text-color="#fff" ghost round size="small" @click="next(tipItem)">
        下一步
      </NButton>
    </template>

    <template #skip>
      <NButton type="primary" color="#fff" text-color="#fff" ghost round size="small" @click="skip">
        跳过
      </NButton>
    </template>

    <template #done>
      <NButton type="primary" color="#fff" text-color="#fff" ghost round size="small" @click="done">
        完成
      </NButton>
    </template>
  </Vue3IntroStep>
</template>

<script setup lang="ts">
// 新手操作指引：头部工具栏的入口按钮，点击后用 vue3-intro-step 分步高亮，引导用户认识顶栏各功能
import Vue3IntroStep from 'vue3-intro-step'

// 引导组件实例：上一步/下一步按钮被自定义插槽接管后，靠它手动驱动步骤切换
const myIntroStep = shallowRef<{ next: () => void, prev: () => void } | null>(null)
const show = shallowRef(false)
// 每一步通过元素 id 定位高亮目标，id 与顶栏各功能按钮上的 id 一一对应
const config = {
  backgroundOpacity: 0.8,
  titleStyle: {
    textAlign: 'left',
    fontSize: '18px',
  },
  contentStyle: {
    textAlign: 'left',
    fontSize: '14px',
  },
  tips: [
    {
      el: '#toggleTheme',
      tipPosition: 'bottom',
      title: '切换系统主题',
      content: '一键开启护眼模式',
    },
    {
      el: '#fullscreen',
      tipPosition: 'bottom',
      title: '全屏/退出全屏',
      content: '一键开启全屏',
    },
    {
      el: '#theme-setting',
      tipPosition: 'bottom',
      title: '设置主题色',
      content: '调整为你喜欢的主题色',
    },
    {
      el: '#user-dropdown',
      tipPosition: 'bottom',
      title: '个人中心',
      content: '查看个人资料和退出系统',
    },
    {
      el: '#menu-collapse',
      tipPosition: 'bottom',
      title: '展开/收起菜单',
      content: '一键展开/收起菜单',
    },
    {
      el: '#top-tab',
      tipPosition: 'bottom',
      title: '标签栏',
      content: '鼠标滚轮滑动可调整至最佳视野',
    },
    {
      el: '#layout-setting',
      tipPosition: 'left',
      title: '调整系统布局',
      content: '将系统布局调整为你喜欢的样子',
    },
  ],
}

/** 跳过引导：直接关闭引导层 */
function skip() {
  show.value = false
}

/** 走到最后一步点完成，同样只是关闭引导层 */
function done() {
  show.value = false
}

/** 默认导航按钮被插槽替换成自定义按钮，须手动调用实例方法驱动步骤切换（入参为组件回调透传，暂未使用） */
function next(_tipItem?: unknown) {
  myIntroStep.value!.next()
}
function prev(_tipItem?: unknown, _index?: unknown) {
  myIntroStep.value!.prev()
}
</script>
