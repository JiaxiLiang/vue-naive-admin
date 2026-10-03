import type { LayoutMode } from '@/settings'
//  权限状态仓库：动态路由表、菜单数据、按钮权限码
// pinia仓库的返回值都是一个对象整合了{ state: ..., actions: ... }
// pinia的核心还是存储状态 提供方法修改状态（数据加工） 全局共享状态 他是不做后端取数据的
// 前端找后端找数据 后端会在若干个表里查询 整合成json输出
// 后端发出的都是json字符串 浏览器（ Axios）转变成js对象 js对象变成路由配置表就是在仓库方法
// 动态路由配置表是用户登录后就会获取 和用户账号挂钩 决定能去哪里不刷新就会一直存在浏览器内存
// 应用初始化的时候 pinia仓库就都初始化了
// 单页面上 组件的状态变化涉及到对应仓库就会响应式变化
// 本质上都是从后端获取到纯数据到前端的时候通过插件转为全面的js对象 根据接收方对应提纯 路由配置对象和 ui组件其实本质都是一样
// 全局配置数据就是一次性获取全面js对象 要筛选使用 如果是组件请求（业务数据）一般都是精确使用
import type { AccessRoute, MenuItem, PermissionItem } from '@/types/models'
import { hyphenate } from '@vueuse/core'
// 第三方库 VueUse 的连字符转换工具函数
import { defineStore } from 'pinia' // 引入 Pinia 的 defineStore 方法定义仓库
import { isExternal } from '@/utils'
// 自定义工具函数，用于判断是否为外部链接

export const usePermissionStore = defineStore('permission', { // 定义并导出一个名为 'permission' 的 store
  state: () => ({ // 定义 state 函数，返回仓库的初始状态
    accessRoutes: [] as AccessRoute[], // 存储动态生成的可访问路由表 不同权限的用户看到菜单项都不一样
    permissions: [] as PermissionItem[], // 存储后端返回的原始权限数据
    menus: [] as MenuItem[], // 存储经过处理和排序后的菜单树数据  一般就是页面的左边的菜单
  }),
  actions: { // 定义仓库的 actions（方法）
    setPermissions(permissions: PermissionItem[]) { // 设置权限并初始化菜单的方法
      this.permissions = permissions // permissions英文就是权限
      this.menus = this.permissions // 开始处理 menus 数据，基于 permissions
        .filter(item => item.type === 'MENU')// menu就是菜单的意思 type是身份属性
        // filter遍历per数组 符合条件组成新数组输出 只认布尔值
        // item是fil 的形参代表数组元素叫a也可以
        // item => item.type === 'MENU'简箭头 左边参数 右边必须是return ===是判断返回布尔
        .map(item => this.getMenuItem(item))
        // map遍历函数 把处理后的元素组成新数组 getMenuItem输出加工成菜单组件以及路由
        .filter((item): item is MenuItem => !!item)
        // 过滤掉无效（如不显示）的菜单项 !!双重非运算符任意类型的值强制转换为布尔值
        .sort((a, b) => a.order - b.order)
        // sort排序方法（两两比较 想减只看正负零来判断顺序）直接修改原数组
        // order是后端传回的数据中的属性之一优先级
        // 链式调用 上一个输出是下一个的输入
    },
    getMenuItem(item: PermissionItem, parent?: MenuItem): MenuItem | null { // 递归生成菜单项的方法
      // item就是后端发出的json转换成的js对象（里面有属性和数组的纯数据）
      // pare是代表父菜单第一次初始化调用的时候就是直接赋予null（用于递归 子菜单挂载父上）
      const route = this.generateRoute(item, item.show ? null : (parent?.key as string | null))
      // show是显示属性  key唯一标识符 item就是
      // 生成路由对象函数 下面，第二参数是？：判断选择
      // ?: 三元运算符（只判断值的对错不判断这个值是否存在）  ?.可选链(就看后面是隔开还是) ?? 空值合并
      /* const res = a ? b?.c : d ?? e 先找： a？:  d??e是d有值就是d  d是null或undef取e */
      // ! 就是非   !!就是转布尔
      if (item.enable && route.path && !route.path.startsWith('http'))
        // enable权限属性 startsWith字符串 方法判断开头是否是http
        this.accessRoutes.push(route)
        // push数组的方法将 把参数添加到数组的最后 该路由添加到可访问路由表中
      const menuItem = {
        // 把后端数据转成js对象  构建菜单项对象给ui组件识别的
        label: route.meta.title, // 菜单显示的标题
        key: route.name, // 菜单的唯一标识，对应路由 name
        path: route.path, // 菜单的路径
        originPath: route.meta.originPath, // 菜单的原始路径（用于外链跳转）
        icon: () => h('i', { class: `${route.meta.icon} text-16` }), // text直接拼接为了格式
        // icon渲染图标 属性 h是vue自带函数（一般是要导入）
        // h创建虚拟 DOM 节点的核心函数 h('div', {}, '你好') i为html标签<i>这样
        // 形成<i>class：...
        order: item.order ?? 0, // 菜单排序权重，默认为 0
      } as MenuItem
      const children = item.children?.filter(item => item.type === 'MENU') || []
      // 筛选出当前项下的子菜单 chi数组里面元素是属性也有数组（树状结构数据）前端接收的js对象就有了
      // 这里不直接给menuitem设计进 item.children是chi里面的数据还是纯数据没设计组件得递归解析出来
      // item.children本质就是套娃一样 里面是也是纯js对象
      // 数组的元素也可以是数组 只有它“直属下一级”的子菜单
      if (children.length) { // 如果存在子菜单
        // length数组长度的属性
        menuItem.children = children // 这是给对象添加这个数组
          .map(child => this.getMenuItem(child, menuItem)) // 递归（调用自己
          // map本身就是会遍历的 以及chi调用map 参数自然是chi的元素 this依旧是仓库
          .filter((item): item is MenuItem => !!item) // 过滤掉无效的子菜单项
          .sort((a, b) => a.order - b.order) // 对子菜单进行排序
          // 最后的menutiem就是树状图的整个菜单 通过map的遍历实现 递归是一趟到底再向上逐一遍历
        if (!menuItem.children.length) // 如果处理完后发现子菜单为空
          delete menuItem.children // 删除 children 属性，避免渲染空菜单
      }
      if (!item.show) // 如果当前项配置为不显示
        return null // 返回 null，在菜单树中移除该项
      return menuItem // 返回构建好的菜单项
    },
    generateRoute(item: PermissionItem, parentKey: string | null): AccessRoute { // 生成标准的 Vue Router 路由对象
      // parentKey父菜单唯一标识 就是id
      let originPath // 声明变量存储原始路径
      if (isExternal(item.path!)) { // 如果是外部链接
        // isE函数导入函数 判断字符串是否是外部链接
        originPath = item.path // 保存原始外部链接地址
        item.component = '/src/views/iframe/index.vue'
        // component：是 Vue Router 配置中的核心属性，指定该路由要渲染哪个 Vue 组件
        // 这个路径是专门展示外部链接的组件
        item.path = `/iframe/${hyphenate(item.code)}`
        // hyphenate第三方函数转换格式比如 将 UserManager 转换为 user-manager
        // 重写路由路径为内部 iframe 路径
      }
      return { // 返回路由配置对象
        name: item.code, // 路由名称，使用权限编码
        path: item.path, // 路由路径
        redirect: item.redirect, // 路由重定向配置
        component: item.component, // 路由对应的组件路径
        meta: { // 路由元信息 存储自定义数据
          originPath, // 原始路径（外链时使用）
          icon: `${item.icon}?mask`, // 图标类名，添加 ?mask 参数
          title: item.name, // 页面标题
          // 后端 layout 字符串与前端 LayoutMode 的契约妥协，见进度文档
          layout: item.layout as LayoutMode, // 页面布局模式
          keepAlive: !!item.keepAlive, // 是否开启页面缓存
          parentKey, // 父级菜单的 key
          btns: item.children // 当前路由下的按钮权限列表
            ?.filter(item => item.type === 'BUTTON') // 筛选类型为按钮的子项
            .map(item => ({ code: item.code, name: item.name })),
          // 提取按钮的编码和名称
        },
      }
    },
    resetPermission() { // 重置权限状态的方法
      this.$reset() // 调用 Pinia 提供的 $reset 方法将 state 重置为初始值
    },
  },
})
/*
数组知识点
forEach()
    作用：遍历数组，对每个元素执行回调函数，不返回新数组（用于打印、修改原数组等副作用操作）。
    参数：forEach(item, index, array)，其中：
    item：当前遍历的元素；
    index：当前元素的索引；
    array：原数组（可选，通常不使用）。
    示例：
      const arr = [1, 2, 3];
      arr.forEach((item, index) => {
        console.log(`索引${index}的元素是${item}`); // 输出：索引0的元素是1，索引1的元素是2，索引2的元素是3
      });

map()
    作用：遍历数组，对每个元素执行回调函数，返回新数组（用于数据转换，如将数字数组转为字符串数组）。
    参数：同forEach（回调函数需返回转换后的值）。
      const arr = [1, 2, 3];
      const newArr = arr.map(item => item * 2); // 将每个元素乘以2
      console.log(newArr); // [2, 4, 6]

findIndex
    查找位置它遍历数组，找出第一个满足条件的元素，并返回该元素的索引（下标）。
    关键点：
    如果找到了，返回具体的索引（如 0, 1, 2...）。
    如果没找到，返回 -1。只查找不改变
filter()
    作用：返回符合条件的元素组成的新数组（用于筛选数据，如筛选偶数、年龄大于18的用户）。
    参数：同forEach（回调函数需返回布尔值，true保留，false丢弃）。
      const arr = [1, 2, 3, 4];
      const evenArr = arr.filter(item => item % 2 === 0); // 筛选偶数
      console.log(evenArr); // [2, 4]

find()
    作用：返回第一个符合条件的元素（若没有则返回undefined，用于查找特定元素，如根据ID找用户）。
      const users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}];
      const user = users.find(item => item.id === 2); // 查找ID为2的用户
      console.log(user); // {id: 2, name: 'Bob'}

sort()
    作用：对数组原地排序（修改原数组），返回排序后的数组（默认按字符串Unicode码排序，数字需自定义比较函数）。
    参数：compareFunction(a, b)（可选，返回负数则a在前，正数则b在前，0则不变）。
    示例（数字升序）：
      const arr = [3, 1, 2];
      arr.sort((a, b) => a - b); // 数字升序排序
      console.log(arr); // [1, 2, 3]
slice()
    作用：截取数组的一部分，返回新数组（不修改原数组，参数为开始索引和结束索引，结束索引不包含）。
    参数：start（开始索引，可选，默认0），end（结束索引，可选，默认数组长度）。
      const arr = [1, 2, 3, 4];
      const subArr = arr.slice(1, 3); // 截取索引1到2的元素（不包含3）
      console.log(subArr); // [2, 3]
splice()
    作用：增删改数组（修改原数组），返回被删除的元素数组。
    参数：start（开始索引），deleteCount（删除数量），items（可选，要添加的元素）。
      const arr = [1, 2, 3, 4];
      const removed = arr.splice(1, 2, 5, 6); // 从索引1开始删除2个元素，添加5和6
      console.log(arr); // [1, 5, 6, 4]（原数组被修改）
      console.log(removed); // [2, 3]
*/
