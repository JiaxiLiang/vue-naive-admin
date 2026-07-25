// 封装通用的“增删改查”（CRUD）业务逻辑，避免在每个页面重复写相同的代码
// 主函数usecrud里面若干个小函数本质上结合它 return 这些函数就形成了闭包
// 封装了这个函数在其他文件，在使用的时候要导入这个函数，然后用解构的语法取到这些函数直接就可以使用
//  闭包的设计 这里涉及到的增删改查函数对象A和对象b，调用都是独立的内存
// 传参的时候 大函数传用的参数，里面的小函数就不用再一一对应的传都可以，共享这些参数更加的便利
import { cloneDeep } from 'lodash-es'
// 导入 lodash-es 的深拷贝函数 第三方库
import { useForm, useModal } from '.' // 导入当前目录下的自定义 Hooks

const ACTIONS = { // 定义操作类型的映射常量
  view: '查看', // 查看操作对应的中文标签
  edit: '编辑', // 编辑操作对应的中文标签
  add: '新增', // 新增操作对应的中文标签
}

export function useCrud({ name, initForm = {}, doCreate, doDelete, doUpdate, refresh }) {
  // 导出 CRUD 逻辑的组合式函数，接收配置对象
  // 参数 用户名 initForm = {}表单的初始化数据结构 doCreate新增函数 删除函数 修改函数 刷新列表函数
  // 后四个都是具体的函数来的
  // useCrud主要作用就是决定何时调用增删改查函数，具体如何实现。删除操作就是传递参数函数
  const modalAction = ref('') // 定义当前弹窗操作类型的响应式变量
  const [modalRef, okLoading] = useModal() // 初始化弹窗 Hook，解构出弹窗实例引用和确认按钮加载状态
  const [modalFormRef, modalForm, validation] = useForm(initForm) // 初始化表单 Hook，解构出表单实例引用、表单数据和验证方法

  /** 新增 */ // 新增功能的注释
  function handleAdd(row = {}, title) {
    // 定义新增处理函数，接收默认行数据和标题
    handleOpen({ action: 'add', title, row: Object.assign({}, cloneDeep(initForm), cloneDeep(row)) }) // 调用打开弹窗方法，合并初始表单和传入数据
  }// assign合并函数 参数二三合并到参数一里面

  /** 修改 */ // 修改功能的注释
  function handleEdit(row, title) { // 定义修改处理函数，接收行数据和标题
    handleOpen({ action: 'edit', title, row }) // 调用打开弹窗方法，传入编辑动作和行数据
  }

  /** 查看 */ // 查看功能的注释
  function handleView(row, title) { // 定义查看处理函数，接收行数据和标题
    handleOpen({ action: 'view', title, row }) // 调用打开弹窗方法，传入查看动作和行数据
  }

  /** 打开modal */ // 打开弹窗的核心逻辑注释
  function handleOpen(options = {}) { // 定义打开弹窗的核心处理函数
    const { action, row, title, onOk } = options // 解构传入的配置项
    modalAction.value = action // 设置当前弹窗的操作类型
    modalForm.value = { ...row } // 设置表单数据为传入的行数据
    modalRef.value?.open({ // 调用弹窗实例的打开方法
      ...options, // 展开其他配置项
      async onOk() { // 定义确认按钮的异步回调函数
        if (typeof onOk === 'function') { // 判断是否有自定义确认回调
          return await onOk() // 若有则执行自定义回调
        }
        else { // 否则
          return await handleSave() // 执行默认的保存逻辑
        }
      },
      title: title ?? (ACTIONS[modalAction.value] || '') + name, // 设置弹窗标题，若未传入则根据动作类型生成默认标题
    })
  }

  /** 保存 */ // 保存功能的注释
  async function handleSave(action) { // 定义异步保存处理函数
    if (!action && !['edit', 'add'].includes(modalAction.value)) { // 校验操作类型，若非编辑或新增则拦截
      return false // 返回 false 表示未执行保存
    }
    await validation() // 执行表单验证
    const actions = { // 定义不同操作对应的 API 和回调逻辑
      add: { // 新增操作配置
        api: () => doCreate(modalForm.value), // 调用新增 API
        cb: () => $message.success('新增成功'), // 成功后的提示消息
      },
      edit: { // 编辑操作配置
        api: () => doUpdate(modalForm.value), // 调用更新 API
        cb: () => $message.success('保存成功'), // 成功后的提示消息
      },
    }

    action = action || actions[modalAction.value] // 获取当前操作对应的配置对象

    try { // 开启异常捕获
      okLoading.value = true // 开启确认按钮加载状态
      const data = await action.api() // 调用对应的 API 并等待结果
      action.cb() // 执行成功后的回调（如提示消息）
      okLoading.value = false // 关闭确认按钮加载状态
      data && refresh(data) // 若有返回数据则刷新列表
    }
    catch (error) { // 捕获异常
      console.error(error) // 打印错误日志
      okLoading.value = false // 关闭确认按钮加载状态
      return false // 返回 false 表示保存失败
    }
  }

  /** 删除 */ // 删除功能的注释
  function handleDelete(id, confirmOptions) { // 定义删除处理函数，接收 ID 和弹窗配置
    if (!id && id !== 0) // 校验 ID 是否有效（允许 ID 为 0）
      return // 无效则直接返回
    const d = $dialog.warning({ // 调用全局弹窗显示警告确认框
      content: '确定删除？', // 设置弹窗内容
      title: '提示', // 设置弹窗标题
      positiveText: '确定', // 设置确认按钮文本
      negativeText: '取消', // 设置取消按钮文本
      async onPositiveClick() { // 定义确认按钮的异步点击回调
        try { // 开启异常捕获
          d.loading = true // 开启弹窗加载状态
          const data = await doDelete(id) // 调用删除 API
          $message.success('删除成功') // 提示删除成功
          d.loading = false // 关闭弹窗加载状态
          refresh(data, true) // 刷新列表，第二个参数通常表示强制回到第一页
        }
        catch (error) { // 捕获异常
          console.error(error) // 打印错误日志
          d.loading = false // 关闭弹窗加载状态
        }
      },
      ...confirmOptions, // 展开其他自定义弹窗配置
    })
  }

  return { // 返回需要暴露的变量和方法
    modalRef, // 弹窗组件引用
    modalFormRef, // 表单组件引用
    modalAction, // 当前操作类型
    modalForm, // 表单数据对象
    okLoading, // 确认按钮加载状态
    validation, // 表单验证方法
    handleAdd, // 新增处理方法
    handleDelete, // 删除处理方法
    handleEdit, // 编辑处理方法
    handleView, // 查看处理方法
    handleOpen, // 打开弹窗方法
    handleSave, // 保存数据方法
  }
}
