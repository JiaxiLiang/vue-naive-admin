import type { PermissionItem, RawUserInfo, UserInfo } from '@/types/models'
import { cloneDeep } from 'lodash-es'
import api from '@/api'
import { basePermissions } from '@/settings'

/**
 * 拉取当前登录用户信息，并把后端原始结构整编为前端统一的 UserInfo 形状
 * @returns 供 user store 存储的用户信息
 */
export async function getUserInfo(): Promise<UserInfo> {
  const res = await api.getUser()
  // data 兜底为空对象，后端返回空时解构不报错
  const { id, username, profile, roles, currentRole } = (res.data || {}) as RawUserInfo
  return {
    id,
    username,
    // profile 为嵌套可选结构，统一用可选链取值避免缺字段时抛错
    avatar: profile?.avatar,
    nickName: profile?.nickName,
    gender: profile?.gender,
    address: profile?.address,
    email: profile?.email,
    roles,
    currentRole,
  }
}

/**
 * 获取当前用户可用权限 = 静态基础权限 + 后端动态权限
 * 动态权限拉取失败只记日志不抛出，保证路由注册主流程不因权限接口抖动而中断
 * @returns 合并后的权限列表
 */
export async function getPermissions(): Promise<PermissionItem[]> {
  let asyncPermissions: PermissionItem[] = []
  try {
    const res = await api.getRolePermissions()
    asyncPermissions = res?.data || []
  }
  catch (error) {
    console.error(error)
  }
  // 深拷贝静态权限，切断与全局配置的引用，避免下游修改污染原始数据
  const staticPermissions: PermissionItem[] = cloneDeep(basePermissions)
  return staticPermissions.concat(asyncPermissions)
}
