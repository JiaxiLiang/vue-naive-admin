import { request } from '@/utils' // ① 拿"加工过的 axios 实例"，不是裸 axios

// api.js 的本质就是：把"一次 HTTP 调用"包装成一个"有名字的 JS 函数"
export default { // 默认导出
  create: data => request.post('/user', data),
  read: (params = {}) => request.get('/user', { params }),
  update: data => request.patch(`/user/${data.id}`, data),
  delete: id => request.delete(`/user/${id}`),
  resetPwd: (id, data) => request.patch(`/user/password/reset/${id}`, data),

  getAllRoles: () => request.get('/role?enable=1'),
}
