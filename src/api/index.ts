import type { LoginToken, PageParams, PageResult, PermissionItem, RawUserInfo } from '@/types/models'
import { request } from '@/utils'

/**
 * CRUD 接口工厂：新增/列表/更新/删除四个标准端点在此收敛为一次声明，各资源不再重复拼样板。
 * @param resource 端点前缀，如 '/user'（create 打到 resource，update/delete 打到 resource/:id）
 * @param readPath 列表查询路径，默认与 resource 相同（分页路径不同的资源单独传入，如 role 传 '/role/page'）
 * 模板参数 T 为实体类型；Q 为列表查询参数类型（各资源按后端契约在 models.ts 收窄），
 * Q 经 MeCrud 的 :get-data 反向推断到页面的 queryItems，查询字段名拼错在编译期即报错
 */
export function createCrudApi<T extends { id: number }, Q extends PageParams & Record<string, unknown> = PageParams & Record<string, unknown>>(resource: string, readPath = resource) {
  return {
    create: (data: Partial<T>) => request.post(resource, data),
    read: (params: Q) => request.get<PageResult<T> | T[]>(readPath, { params }),
    update: (data: Partial<T> & { id: number }) => request.patch(`${resource}/${data.id}`, data),
    delete: (id: number) => request.delete(`${resource}/${id}`),
  }
}

export default {
  /** 获取用户信息（后端原始形状含嵌套 profile，由 store/helper.ts 重组为前端 UserInfo） */
  getUser: () => request.get<RawUserInfo>('/user/detail'),
  /** 刷新 token（无感刷新链路经 setupHttpAuth 注入 http 层调用；skipAuthRefresh 防自身 401 再次触发刷新形成死循环） */
  refreshToken: () => request.get<LoginToken>('/auth/refresh/token', { skipAuthRefresh: true }),
  /** 登出（needTip:false：失败时不走全局错误提示） */
  logout: () => request.post('/auth/logout', {}, { needTip: false }),
  /** 切换当前角色（后端返回切换后账号的新 token 载荷） */
  switchCurrentRole: (role: number | string) => request.post<LoginToken>(`/auth/current-role/switch/${role}`),
  /** 获取角色权限树 */
  getRolePermissions: () => request.get<PermissionItem[]>('/role/permissions/tree'),
  /** 校验菜单路径是否有效 */
  validateMenuPath: (path: string) => request.get<boolean>(`/permission/menu/validate?path=${path}`),
}
