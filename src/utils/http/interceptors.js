// URL是后端暴露的API接口地址，而非数据库文件的直接路径（如https://api.example.com/users）
// 后端通过该接口逻辑（如查询数据库、处理业务）返回数据，而非直接指向数据库文件
// 前端插件发出的是JS对象先转化为JSOM结合URL给到后端查询后端返回的是JSOM给到前端再转化为这也是对象
// 本质上在传输的过程中都是jsom 呃URL是后端的数据库接口所以前端是的要根据接口文档才能正确生成
import { useAuthStore } from '@/store' // 从store中导入认证状态管理模块
import { resolveResError } from './helpers' // 从工具函数中导入错误解析函数

export function setupInterceptors(axiosInstance) { // 导出设置axios拦截器的函数，参数为axios实例
  const SUCCESS_CODES = [0, 200] // 定义接口成功的状态码数组（根据业务约定）
  function resResolve(response) { // 响应成功时的拦截处理函数
    // response 就是前端整合json而成的庞大的js对象
    const { data, status, config, statusText, headers } = response
    // 解构响应对象，获取数据、状态码、配置、状态文本、响应头
    if (headers['content-type']?.includes('json')) {
      // 检查响应头是否为JSON类型（避免非JSON响应干扰逻辑）
      // headers['content-type']本质就是headers['content-type']因为名字有-不用[]就会变成减号
      if (SUCCESS_CODES.includes(data?.code)) {
        // 判断业务状态码是否在成功码数组中
        return Promise.resolve(data)
        // 业务成功，直接返回数据
        // promise是js自带全局对象
        // resolve手动设置状态为成功
      }
      const code = data?.code ?? status // 获取错误码（优先取业务code，无则取HTTP状态码）
      const needTip = config?.needTip !== false // 判断是否需要全局提示（默认true，config中可覆盖）
      // 根据错误码处理业务逻辑，并生成提示信息
      const message = resolveResError(code, data?.message ?? statusText, needTip) // 调用错误解析函数生成提示文案
      return Promise.reject({ code, message, error: data ?? response })
      // 业务失败，返回错误对象  reject设置状态为失败
    }
    return Promise.resolve(data ?? response) // 非JSON响应（如文件流），直接返回原始数据
  }

  axiosInstance.interceptors.request.use(reqResolve, reqReject)
  // 注册请求拦截器（成功/失败分别调用reqResolve/reqReject）
  axiosInstance.interceptors.response.use(resResolve, resReject)
  // 注册响应拦截器（成功/失败分别调用resResolve/resReject）
  // 函数都是插件自带的
}

function reqResolve(config) { // 请求发送前的拦截处理函数
  // 处理不需要token的请求（如公开接口）
  if (config.needToken === false) { // 检查请求配置中是否明确不需要token
    return config // 直接返回配置，不添加token
  }

  const { accessToken } = useAuthStore() // 从认证store中获取accessToken（登录后存储的token）
  if (accessToken) { // 如果存在accessToken
    // token格式：Bearer + 空格 + token字符串（符合JWT标准）
    config.headers.Authorization = `Bearer ${accessToken}`
    // 在请求头中添加Authorization字段，携带token
  }

  return config // 返回修改后的请求配置
}

function reqReject(error) { // 请求失败时的拦截处理函数
  return Promise.reject(error) // 直接返回错误，不做额外处理
}

async function resReject(error) { // 响应失败时的拦截处理函数
  if (!error || !error.response) { // 处理网络错误或无响应的情况（如请求超时、断网）
    const code = error?.code // 获取错误码（如'ERR_NETWORK'）
    /** 根据错误码处理业务逻辑，生成提示信息 */
    const message = resolveResError(code, error.message) // 调用错误解析函数生成提示文案
    return Promise.reject({ code, message, error }) // 返回错误对象
  }

  const { data, status, config } = error.response // 解构响应对象，获取数据、状态码、请求配置
  const code = data?.code ?? status // 获取错误码（优先取业务code，无则取HTTP状态码）
  const needTip = config?.needTip !== false // 判断是否需要全局提示
  const message = resolveResError(code, data?.message ?? error.message, needTip) // 生成提示信息
  return Promise.reject({ code, message, error: error.response?.data || error.response }) // 返回错误对象，包含响应数据
}
/*
拦截器在“后端数据调用”过程中的作用
拦截器是axios的核心机制，用于在请求发送前/响应返回后 处理设置：

1. 请求拦截器（interceptors.request）
作用：在请求发送到后端前，对请求进行预处理（如添加token、修改请求头、统一参数格式等）。
示例中的具体逻辑：

2. 响应拦截器（interceptors.response）
作用：在响应返回后，对响应结果进行后处理（如错误提示、数据格式化、状态码判断等）。

*/
/* window结构知识点
================================================================================
                【 Window 对象层级与功能全景图 】
================================================================================

 window (全局根对象：浏览器一切功能的入口)
 │
 ├──【一、BOM 模块：浏览器控制区】─────────────────────────────────────────────
 │   (作用：控制浏览器软件本身的行为，与页面内容无关)
 │
 ├── navigator (浏览器身份对象)
 │   ├── userAgent        -> [属性] 获取浏览器名称、版本、操作系统信息
 │   └── onLine           -> [属性] 判断当前网络是否在线
 │
 ├── location (地址栏对象)
 │   ├── href             -> [属性] 获取或跳转当前页面地址
 │   ├── search           -> [属性] 获取 URL 问号后面的参数
 │   └── reload()         -> [方法] 强制刷新当前页面
 │
 ├── history (历史记录对象)
 │   ├── back()           -> [方法] 后退一页
 │   ├── forward()        -> [方法] 前进一页
 │   └── go(n)            -> [方法] 跳转到历史记录的第 n 页
 │
 ├── localStorage (本地持久存储)
 │   ├── setItem(k, v)    -> [方法] 存入数据（关闭浏览器后仍在）
 │   └── getItem(k)       -> [方法] 根据键名读取数据
 │
 ├── console (调试控制台)
 │   ├── log()            -> [方法] 打印普通日志信息
 │   └── error()          -> [方法] 打印红色报错信息
 |
 └── sessionStorage (会话临时存储)
     ├── setItem(k, v)    -> [方法] 存入数据（关闭标签页即销毁）
     └── getItem(k)       -> [方法] 根据键名读取数据
 │
 ├──【二、DOM 模块：页面控制区】───────────────────────────────────────────────
 │   (作用：控制网页内容，是前端操作页面的核心)
 │
 └── document (文档文档对象模型入口)
     ├── documentElement  -> [属性] 获取整个 <html> 根节点
     ├── head             -> [属性] 获取 <head> 标签对象
     ├── body             -> [属性] 获取 <body> 标签对象
     │
     ├── getElementById() -> [方法] 通过 ID 精准获取一个标签
     ├── querySelector()  -> [方法] 通过 CSS 选择器获取一个标签
     │
     └── createElement()  -> [方法] 动态创建一个新的 HTML 标签
 │
 ├──【三、JS 核心：逻辑与工具区】───────────────────────────────────────────────
 │   (作用：提供编程语言的基础能力，不特定属于浏览器，但在浏览器中可用)
 │
 │
 ├── 1. 运算符 ────────────────────────────────────────────────────────
 │   (语言关键字，直接使用，不需要打点调用)
 │   ├── typeof           -> [运算符] 安全判断类型，返回类型字符串(如 "number")
 │   ├── instanceof       -> [运算符] 判断对象是否属于某构造函数的实例 返回布尔
 │   ├── new              -> [运算符] 创建对象实例
 │   └── delete           -> [运算符] 删除对象的属性
 │
 ├── 2. 全局函数 ────────────────────────────────────────────────────────
 │   (全局可直接调用的工具函数)
 │   ├── parseInt()       -> [方法] 将字符串解析为整数
 │   ├── parseFloat()     -> [方法] 将字符串解析为浮点数
 │   └── isNaN()          -> [方法] 判断一个值是否是 NaN
 │
 ├── 3. 内置构造函数 ────────────────────────────────────────────────────────
 │   (对象的“蓝本”，用来创建特定类型的对象)
 │   │
 │   ├── Object (老祖宗对象)
 │   │   ├── keys()       -> [静态方法] 获取对象所有键名组成的数组
 │   │   ├── assign() -> [静态方法] 对象属性合并 参数一是目标对象后面若干个会复制到一 后面属性相同会覆盖前面的值
 │   │   └── prototype    -> [原型工具箱] (所有对象共享的方法)
 │   │       ├── toString()      -> [方法] 最原始的类型识别方法 (返回 "[object Type]")
 │   │       └── hasOwnProperty()-> [方法] 判断属性是否为自身拥有(非继承)
 │   │
 │   ├── Array (数组对象)
 │   │   ├── isArray()    -> [静态方法] 精准判断是否为数组 (官方推荐)
 │   │   └── prototype    -> [原型工具箱]
 │   │       ├── push()          -> [方法] 末尾添加元素
 │   │       ├── map()           -> [方法] 遍历并映射数组
 │   │       └── filter()        -> [方法] 过滤数组元素
 │   │
 │   ├── Function (函数对象)
 │   │   └── prototype    -> [原型工具箱]
 │   │       ├── call()          -> [方法] 改变函数 this 指向并执行
 │   │       └── apply()         -> [方法] 改变函数 this 指向并执行(参数为数组)
 │   |
 ├── Map (映射/字典对象)  <--  键值对集合，键可以是任意类型区别Object属性只能是字符串 访问必须调用方法
 │   │   └── prototype
 │   │       ├── size         -> [属性] (注意不是 length) 返回元素个数
 │   │       ├── set()        -> [方法] 添加/修改键值对
 │   │       └── get()        -> [方法] 根据键获取值
 │   │
 │   └── Set (集合对象)       <--  唯一值的集合，Set 是一个带有“自动去重滤镜”的可迭代容器 自带去重
 │       └── prototype
 │           ├── size         -> [属性] 返回元素个数
 │           ├── add()        -> [方法] 添加新元素
 │           └── has()        -> [方法] 判断是否包含某元素
 │   ├── String (字符串对象)
 │   ├── Number (数值对象)
 │   ├── Boolean (布尔对象)
 │   ├── Date (日期对象)
 │   └── RegExp (正则对象)
 │
 ├── 4. 工具对象 ────────────────────────────────────────────────────────
 │   (直接使用的静态工具包，不需要 new)
 │   │
 │   ├── Math (数学计算工具)
 │   │   ├── random()     -> [方法] 生成 0-1 之间的随机数
 │   │   ├── floor()      -> [方法] 向下取整
 │   │   └── PI           -> [属性] 圆周率 3.14159...
 │   │
 │   ├── JSON (数据转换器)
 │   │   ├── parse()      -> [方法] 将 JSON 字符串解析为 JS 对象
 │   │   └── stringify()  -> [方法] 将 JS 对象序列化为 JSON 字符串
 │   │
 │   └── console (调试控制台 - 宿主提供，但归为此类)
 │       ├── log()        -> [方法] 打印普通日志信息
 │       └── error()      -> [方法] 打印红色报错信息
 │
 └── 5. 异步与容器 ────────────────────────────────────────────────────────
     │
     ├── Promise (异步容器)
     │   ├── then()       -> [方法] 定义任务成功后的回调
     │   ├── catch()      -> [方法] 定义任务失败后的回调
     │   └── resolve()    -> [方法] 手动将状态改为成功
     │
     └── 定时器
         ├── setTimeout() -> [方法] 延迟 t 毫秒后执行函数 fn (只执行一次)
         └── setInterval()-> [方法] 每隔 t 毫秒执行函数 fn (循环执行)

================================================================================
*/
