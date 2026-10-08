<template>
  <n-breadcrumb>
    <n-breadcrumb-item v-if="!breadItems?.length" :clickable="false">
      {{ route.meta.title }}
    </n-breadcrumb-item>
    <n-breadcrumb-item
      v-for="(item, index) of breadItems"
      v-else
      :key="item.code"
      :clickable="!!item.path"
      @click="handleItemClick(item)"
    >
      <!-- 仅非末级面包屑项挂子菜单下拉，末级自身即当前页无需导航 -->
      <n-dropdown
        :options="index < breadItems.length - 1 ? getDropOptions(item.children) : []"
        @select="handleDropSelect"
      >
        <div class="flex items-center">
          <i :class="item.icon" class="mr-8" />
          {{ item.name }}
        </div>
      </n-dropdown>
    </n-breadcrumb-item>
  </n-breadcrumb>
</template>

<script setup lang="ts">
// 面包屑导航：路由变化时在权限菜单树中定位当前路由，用"祖先链 + 自身"还原层级；中间层级用下拉展示兄弟子菜单，树中找不到时回退显示路由 meta.title
import type { PermissionItem } from '@/types/models'
import { usePermissionStore } from '@/store'

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()

const breadItems = ref<PermissionItem[]>([])
// 监听路由名，重新在权限树中查找匹配链作为面包屑数据
watch(
  () => route.name,
  (v) => {
    breadItems.value = findMatchs(permissionStore.permissions, v) || []
  },
  { immediate: true },
)

/** 深度优先在权限树中查找 code 对应节点，返回"根到该节点"的路径链；未命中返回 null */
function findMatchs(tree: PermissionItem[], code: unknown, parents: PermissionItem[] = []): PermissionItem[] | null {
  for (const item of tree) {
    if (item.code === code) {
      return [...parents, item]
    }
    if (item.children?.length) {
      const found = findMatchs(item.children, code, [...parents, item])
      if (found) {
        return found
      }
    }
  }
  return null
}

/** 点击面包屑项：仅带 path 的叶子层级可跳转，且当前页不重复跳 */
function handleItemClick(item: PermissionItem) {
  if (item.path && item.code !== route.name) {
    router.push(item.path)
  }
}

/** 把某层级的子菜单转成下拉选项，隐藏项不进入下拉 */
function getDropOptions(list: PermissionItem[] = []) {
  return list
    .filter(item => item.show)
    .map(child => ({
      label: child.name,
      key: child.code,
      icon: () => h('i', { class: child.icon }),
    }))
}

/** 选中下拉子项后按 code（即路由 name）跳转 */
function handleDropSelect(code: string | number) {
  if (code && code !== route.name) {
    router.push({ name: code as string })
  }
}
</script>
