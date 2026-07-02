import { request } from '@/utils' // 从@/utils模块导入封装好的HTTP请求实例request

export default { // 导出默认对象，包含用户与认证相关的API接口方法集合
  // 获取用户信息
  getUser: () => request.get('/user/detail'), // 定义getUser方法，发起GET请求获取用户详情数据
  // 刷新token
  refreshToken: () => request.get('/auth/refresh/token'), // 定义refreshToken方法，发起GET请求刷新认证令牌
  // 登出
  logout: () => request.post('/auth/logout', {}, { needTip: false }), // 定义logout方法，发起POST请求登出，配置项needTip: false表示不显示全局提示
  // 切换当前角色
  switchCurrentRole: role => request.post(`/auth/current-role/switch/${role}`), // 定义switchCurrentRole方法，接收role参数并发起POST请求切换角色
  // 获取角色权限
  getRolePermissions: () => request.get('/role/permissions/tree'), // 定义getRolePermissions方法，发起GET请求获取角色权限树形结构数据
  // 验证菜单路径
  validateMenuPath: path => request.get(`/permission/menu/validate?path=${path}`), // 定义validateMenuPath方法，接收path参数作为查询参数验证菜单路径权限
}
/*
  代码执行步骤顺序：

  1. 【模块导入阶段】
     - 第1行：执行import语句，加载@/utils模块中的request对象，该对象封装了axios或fetch等HTTP请求逻辑。

  2. 【对象定义阶段】
     - 第3行：开始定义并导出默认对象，该对象作为API接口的统一命名空间。

  3. 【接口方法定义阶段】
     - 第5行：定义getUser属性，值为箭头函数，调用request.get请求'/user/detail'接口。
     - 第7行：定义refreshToken属性，值为箭头函数，调用request.get请求'/auth/refresh/token'接口。
     - 第9行：定义logout属性，值为箭头函数，调用request.post请求'/auth/logout'接口，传入空对象参数和配置对象{ needTip: false }。
     - 第11行：定义switchCurrentRole属性，值为箭头函数，接收role参数，拼接URL路径并发起POST请求。
     - 第13行：定义getRolePermissions属性，值为箭头函数，调用request.get请求'/role/permissions/tree'接口。
     - 第15行：定义validateMenuPath属性，值为箭头函数，接收path参数，拼接URL查询参数并发起GET请求。

  4. 【模块导出完成】
     - 第16行：对象定义结束，当前模块向外暴露包含上述所有方法的API对象，供其他模块调用。
*/
