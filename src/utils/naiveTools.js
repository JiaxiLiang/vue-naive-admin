// 针对 NaiveUI 组件库的特定辅助方法
import * as NaiveUI from 'naive-ui' // 导入 naive-ui 组件库的所有模块
import { useAppStore } from '@/store' // 导入全局状态管理 store
import { isNullOrUndef } from '@/utils' // 导入判空工具函数

export function setupMessage(NMessage) { // 导出消息初始化函数，接收原生消息实例
  class Message { // 定义消息管理类
    static instance // 静态属性，用于存储单例实例
    constructor() { // 构造函数
      // 单例模式
      if (Message.instance) // 如果实例已存在
        return Message.instance // 直接返回现有实例，保证单例
      Message.instance = this // 否则将当前实例赋值给静态属性
      this.message = {} // 初始化消息对象，用于存储消息实例
      this.removeTimer = {} // 初始化定时器对象，用于存储销毁定时器
    }

    removeMessage(key, duration = 5000) { // 定义移除消息的方法，默认 5 秒后移除
      this.removeTimer[key] && clearTimeout(this.removeTimer[key]) // 如果存在该 key 的定时器，先清除（防抖）
      this.removeTimer[key] = setTimeout(() => { // 设置新的定时器
        this.message[key]?.destroy() // 时间到后销毁对应 key 的消息
      }, duration) // 定时器结束
    }

    destroy(key, duration = 200) { // 定义销毁方法，默认延迟 200 毫秒
      setTimeout(() => { // 设置定时器
        this.message[key]?.destroy() // 销毁指定 key 的消息
      }, duration) // 定时器结束
    }

    showMessage(type, content, option = {}) { // 核心方法：显示消息
      if (Array.isArray(content)) { // 如果内容是数组
        return content.forEach(msg => NMessage[type](msg, option)) // 遍历数组，逐条调用原生消息方法
      }

      if (!option.key) { // 如果没有指定 key（不需要手动控制关闭）
        return NMessage[type](content, option) // 直接调用原生消息方法并返回
      }

      const currentMessage = this.message[option.key] // 获取当前 key 对应的消息实例
      if (currentMessage) { // 如果消息已存在（更新模式）
        currentMessage.type = type // 更新消息类型
        currentMessage.content = content // 更新消息内容
      }
      else { // 否则（新建模式）
        this.message[option.key] = NMessage[type](content, { // 调用原生方法创建新消息并存储
          ...option, // 展开配置项
          duration: 0, // 关键：设为 0，不自动关闭，由 removeMessage 控制
          onAfterLeave: () => { // 消息离开后的回调
            delete this.message[option.key] // 从存储中移除该消息引用
          },
        })
      }
      this.removeMessage(option.key, option.duration) // 调用移除逻辑，开始计时关闭
    }

    loading(content, option) { // loading 类型消息快捷方法
      this.showMessage('loading', content, option) // 调用 showMessage
    }

    success(content, option) { // success 类型消息快捷方法
      this.showMessage('success', content, option) // 调用 showMessage
    }

    error(content, option) { // error 类型消息快捷方法
      this.showMessage('error', content, option) // 调用 showMessage
    }

    info(content, option) { // info 类型消息快捷方法
      this.showMessage('info', content, option) // 调用 showMessage
    }

    warning(content, option) { // warning 类型消息快捷方法
      this.showMessage('warning', content, option) // 调用 showMessage
    }
  }

  return new Message() // 返回 Message 类的实例（单例）
}

export function setupDialog(NDialog) { // 导出对话框初始化函数，接收原生对话框实例
  NDialog.confirm = function (option = {}) { // 扩展 confirm 方法
    const showIcon = !isNullOrUndef(option.title) // 如果有标题则显示图标
    return NDialog[option.type || 'warning']({ // 调用原生 dialog 方法，默认为 warning 类型
      showIcon, // 图标显示状态
      positiveText: '确定', // 确认按钮文字
      negativeText: '取消', // 取消按钮文字
      onPositiveClick: option.confirm, // 确认回调
      onNegativeClick: option.cancel, // 取消回调
      onMaskClick: option.cancel, // 点击遮罩层回调
      ...option, // 展开其余配置
    })
  }

  return NDialog // 返回扩展后的 NDialog
}

export function setupNaiveDiscreteApi() { // 导出 naive-ui 独立 API 初始化函数
  const appStore = useAppStore() // 获取 store 实例
  const configProviderProps = computed(() => ({ // 计算属性，响应式配置
    theme: appStore.isDark ? NaiveUI.darkTheme : undefined, // 根据状态判断是否应用暗色主题
    themeOverrides: useAppStore().naiveThemeOverrides, // 主题覆盖配置
  }))
  const { message, dialog, notification, loadingBar } = NaiveUI.createDiscreteApi( // 创建独立 API 实例
    ['message', 'dialog', 'notification', 'loadingBar'], // 指定需要的 API 类型
    { configProviderProps }, // 传入配置属性
  )

  window.$loadingBar = loadingBar // 挂载到 window 对象，全局可用
  window.$notification = notification // 挂载到 window 对象
  window.$message = setupMessage(message) // 挂载封装后的 message
  window.$dialog = setupDialog(dialog) // 挂载封装后的 dialog
}
/*
[ 你的代码 ]
     |
     | 调用 (逻辑层)
     ▼
[ window.$message ] (挂在 window 上，为了方便调用)
     |
     | 内部处理
     ▼
[ 动态创建 DOM 节点 ]
     |
     | 挂载
     ▼
[ document.body ] (最终显示在 DOM 树的 body 末端)
直接挂载doc里面js无法直接访问要通过dom 而且这些对象本身就具备方法挂载win可以全局使用
*/
/*
 window (全局根对象)
 │
 ├──【一、BOM 模块】(浏览器自带)
 │   └── location, navigator, localStorage...
 │
 ├──【二、DOM 模块】(页面文档)
 │   └── document...
 │
 ├──【三、JS 核心】(语言工具)
 │   └── JSON, Promise, console...
 │
 └──【四、开发者扩展区】(人为挂载，非浏览器自带) 👈 新增区域！
     │
     └── $message       -> [Naive UI] 全局消息
     └── $dialog        -> [Naive UI] 全局弹窗
     └── $notification  -> [Naive UI] 通知提醒
     └── $loadingBar    -> [Naive UI] 加载条

*/
