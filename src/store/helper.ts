//  Store 辅助函数：处理数据持久化（存 LocalStorage）
import type { PermissionItem, RawUserInfo, UserInfo } from '@/types/models'
import { cloneDeep } from 'lodash-es'
// 引入 lodash-es 库的深拷贝方法 里有现成的函数
// cloneDeep 专门用来安全复制数据防止串台
// 基本数据类型（数字、字符串、布尔值等） 不会共享同一地址 let b = 10; let a = b; b改变了不影响a
// 引用数据类型（对象 {}、数组 [] 等）共享地址 let b = { name: '张三' }; let a = b;  // a 和 b 指向内存中同一个对象
// b重新赋值其他数组就不影响a  如果是修改ab都会改变
import api from '@/api' // 引入全局聚合的 API 接口对象，用于发起网络请求
import { basePermissions } from '@/settings'
// 引入项目全局配置中的基础权限列表（静态权限）

export async function getUserInfo(): Promise<UserInfo> { // 定义并导出异步函数：获取并格式化当前登录用户的信息
  const res = await api.getUser()
  // 等待并接收后端接口返回的原始用户数据
  // getUser获取当前用户的数据  res接收的是一个完整响应对象包含了 HTTP 状态码、响应头、配置信息等。
  const { id, username, profile, roles, currentRole } = (res.data || {}) as RawUserInfo
  // res.data才是纯数据  res.data || {}这里先执行或 data有值才会赋值
  // 从响应体中解构所需字段，若 data 为空则降级为空对象，防止抛错
  return { // 返回经过提取和重组的用户信息对象
    id, // 用户唯一标识 ID
    username, // 用户登录账号
    avatar: profile?.avatar, // 用户头像，使用可选链操作符防止 profile 未定义时报错
    nickName: profile?.nickName, // 用户昵称
    gender: profile?.gender, // 用户性别
    address: profile?.address, // 用户地址
    email: profile?.email, // 用户邮箱
    roles, // 用户拥有的所有角色列表
    currentRole, // 用户当前切换/激活的角色
  }// 输出后端返回的.data数据
}

export async function getPermissions(): Promise<PermissionItem[]> {
  // 定义并导出异步函数：获取当前用户的合并权限列表
  let asyncPermissions: PermissionItem[] = [] // 声明变量存放从后端获取的动态权限，初始默认为空数组
  try { // 开启异常捕获块，处理网络请求或接口异常
    const res = await api.getRolePermissions()
    // 等待并接收后端接口返回的当前角色权限数据
    // getRolePermissions()获取权限
    asyncPermissions = res?.data || []
    // 先判断？res是否空 再判断data是否有值
  }
  catch (error) { // 捕获 try 块中抛出的错误对象
    console.error(error) // 在控制台打印错误信息，便于开发者调试排查
  }
  // try {}可能会报错的代码放进去 catch (error) {}：如果真的报错不会直接崩溃白屏，而是会立刻跳进 catch 里
  // try里面任意报错 都直接到catch里 等于没生效数组还是空
  // basePermissions就是那个基础权限 cloneDeep第三方复制函数 地址分离
  const staticPermissions: PermissionItem[] = cloneDeep(basePermissions)
  return staticPermissions.concat(asyncPermissions) // 数组合并
}

/*
  代码执行步骤顺序：

  【getUserInfo 函数执行步骤】
  1. 触发异步请求：调用 api.getUser() 向后端发起获取用户信息的请求，并使用 await 暂停函数执行，等待 Promise 完成。
  2. 安全解构数据：请求成功返回后，从 res.data 中提取 id、username 等字段。如果后端没有返回 data，则使用 {} 作为兜底，确保解构操作不会导致程序崩溃。
  3. 数据重组与返回：将解构出来的数据组装成前端状态管理所需的统一格式返回。其中针对 profile 嵌套对象使用了可选链 (?.)，保证在 profile 为空时不会报错，而是安全地返回 undefined。

  【getPermissions 函数执行步骤】
  1. 初始化动态权限：定义 asyncPermissions 变量并赋值为空数组，作为后续接收动态权限的容器。
  2. 发起异步请求并捕获异常：
     a. 进入 try 块，调用 api.getRolePermissions() 向后端请求当前角色的动态权限。
     b. 请求成功后，将返回的数据赋值给 asyncPermissions（同样带有空数组兜底逻辑）。
     c. 如果请求过程中发生任何错误（如网络断开、接口500等），程序跳转到 catch 块，将错误信息打印到控制台，保证主流程不中断。
  3. 合并并返回最终权限：
     a. 使用 cloneDeep(basePermissions) 对本地配置的基础静态权限进行深拷贝（避免后续操作污染全局配置的原始数据）。
     b. 调用 .concat(asyncPermissions) 将深拷贝后的静态权限与后端获取的动态权限拼接成一个新的数组。
     c. 将合并后的完整权限数组返回给调用方（通常会被路由守卫或 store 调用以生成动态路由）。
*/
