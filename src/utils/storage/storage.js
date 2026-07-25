// 存储模块的引擎
// js中的 JSON是全局变量专门用来提供两个转换方法的一个工具箱
// JSON.stringify()打包 js对象 -> 字符串 JSON.parse()拆包 字符串 -> js对象
// 导入判断是否为 null 或 undefined 的工具函数
import { isNullOrUndef } from '@/utils'

class Storage { // 定义 Storage 类，用于封装本地缓存逻辑
  constructor(option) { // 构造函数，接收配置对象
    this.storage = option.storage
    // 挂载具体的存储引擎 (localStorage 或 sessionStorage
    // this是实例对象
    this.prefixKey = option.prefixKey // 挂载键名前缀，防止不同项目键名冲突
  } // 作用就是给实例化对象添加两个属性，在调用构造函数的同时
  // 它会在内存中添加这两个属性。构造函数的参数是调用new实例化时传进去的参数
  // 把里面的键位值给到实例对象的属性。
  // storage存的是浏览器原生对象 localStorage 或 sessionStorage
  // prefixKey的值是把存进去的数据加个字符串区别

  getKey(key) { // 生成最终存储键名的方法
    return `${this.prefixKey}${key}`.toLowerCase()
    // 拼接前缀和键名，toLowerCase是字符串自带方法  大写转为小写
  } // getKey 方法结束
  // 在类里面定义方法不需要function关键字

  set(key, value, expire) { // 设置缓存的方法，接收参数键、值、过期时间(秒)
    const stringData = JSON.stringify({ // 将要存储的数据对象转为 JSON 字符串
      value, // 实际的业务数据值
      time: Date.now(), // 记录当前存入的时间戳
      expire: !isNullOrUndef(expire) ? Date.now() + expire * 1000 : null, // 计算过期时间戳，若无则存 null
    }) // JSON.stringify 结束
    this.storage.setItem(this.getKey(key), stringData) // 调用原生 API 将字符串存入存储引擎
  } // setItem保存方法 两个浏览器原生仓库对象都有的

  get(key) { // 获取缓存值的方法，只返回业务数据
    const { value } = this.getItem(key, {}) // 调用内部的 getItem 方法获取完整对象，并解构出 value
    return value // 返回业务数据
  } // get 方法结束

  getItem(key, def = null) { // 获取缓存原始对象的方法，支持设置默认返回值
    // def是默认null 如果传值的可以是任意（数组 对象等都可以）
    const val = this.storage.getItem(this.getKey(key)) // 从原生存储中读取字符串
    if (!val) // 如果不存在该值
      return def // 直接返回默认值
    try { // 尝试解析 JSON 字符串
      const data = JSON.parse(val) // 将字符串解析为 JS 对象
      const { value, time, expire } = data // 解构出值、存入时间、过期时间
      if (isNullOrUndef(expire) || expire > Date.now()) { // 如果没设过期时间，或者尚未过期
        return { value, time } // 返回包含值和时间的对象
      } // if 结束
      this.remove(key) // 若已过期，调用 remove 方法清除该缓存
      return def // 返回默认值
    } // try 结束
    catch (error) { // 捕获 JSON 解析失败的错误
      console.error(error) // 打印错误信息
      this.remove(key) // 清除损坏的缓存数据
      return def // 返回默认值
    } // catch 结束
  } // getItem 方法结束

  remove(key) { // 移除指定缓存的方法
    this.storage.removeItem(this.getKey(key)) // 调用原生 API 删除指定键
  } // removeItem是js仓库自带清空对应的键

  clear() { // 清空所有缓存的方法
    this.storage.clear() // 调用原生 API 清空当前存储引擎
  } // clear 方法js仓库方法清空全部
} // Storage 类结束
//  生成参数的函数以及它的返回值其实已经实例化了
// 所以直接调用这个函数就可以得到这一个类的实例化
export function createStorage({ prefixKey = '', storage = sessionStorage }) { // 导出创建存储实例的工厂函数
  return new Storage({ prefixKey, storage }) // 实例化并返回 Storage 对象
}
// 参数storage = sessionStorage 后面是js全局对象不用导入直接任意调用（这里调用的时候也不用传参数）
//  prefixKey = ''的含义就是想实例这个类的时候就只要传第一个参数 (不传就是默认不变)
// 传个aaa那么初始化实例的时候其实是没变化的 只有当调用了getkey方法pre参数的aaa就会给到key之前形成区分
/*
 * ====================================================================================
 * JavaScript 浏览器存储知识点
 * ====================================================================================
 *
 * 一、浏览器的两大仓库：localStorage 与 sessionStorage
 * -----------------------------------------------------------------------------------
 *
 * 1. localStorage (本地存储 - 永久仓库)
 *    - 特点：手动清空才消失，关闭浏览器/电脑重启后依然存在。
 *    - 容量：一般为 5MB 左右。
 *    - 场景：用于“持久化”数据，如：记住密码、网站主题设置、长期未登录的用户信息。
 *
 * 2. sessionStorage (会话存储 - 临时仓库)
 *    - 特点：生命周期仅限于当前标签页。刷新页面(F5)数据还在，但关闭标签页立刻销毁。
 *    - 容量：一般为 5MB 左右。
 *    - 场景：用于“一次性”数据，如：本次登录的验证码、表单填写中途保存。
 *
 * 3. 共同点 (核心机制)
 *    - A. 同源策略：只有同一个域名、同一个协议、同一个端口下的页面才能互相访问。
 *    - B. 【关键限制】：只能存储“字符串”！不能直接存对象、数组、数字。
 *
 * ====================================================================================
 * 二、核心技术：JSON.stringify 与 JSON.parse (打包与拆包)
 * ====================================================================================
 *
 * 1. 问题：如果你想直接存一个对象，会发生什么？
 *    const userObj = { name: '张三', age: 18 };
 *    localStorage.setItem('userError', userObj);
 *    -> 结果：存进去变成了 "[object Object]" —— 数据坏了，取不出来详细内容。
 *
 * 2. 【存数据】JSON.stringify (序列化/打包)
 *    - 作用：把 JS 对象 转换成 标准格式的字符串。
 *    const userString = JSON.stringify(userObj);
 *    localStorage.setItem('userCorrect', userString); // 安全存入
 *
 * 3. 【取数据】JSON.parse (反序列化/拆包)
 *    - 作用：把字符串 还原成 JS 对象。
 *    const getData = localStorage.getItem('userCorrect');
 *    const finalUser = JSON.parse(getData); // 还原成对象，可正常使用
 *
 * ====================================================================================
 * 三、常用 API 方法 (增删改查)
 * ====================================================================================
 *
 * 以下方法 localStorage 和 sessionStorage 用法完全一致：
 *
 * 1. setItem(key, value) - 存数据
 *    localStorage.setItem('token', 'abc-123');
 *
 * 2. getItem(key) - 取数据
 *    const token = localStorage.getItem('token'); // 若无数据则返回 null
 *
 * 3. removeItem(key) - 【重点】删除指定数据
 *    作用：精确删除某一条数据。
 *    localStorage.removeItem('token');
 *
 * 4. clear() - 【重点】清空仓库
 *    作用：销毁当前域名下所有存储数据（慎用）。
 *    localStorage.clear();
 *
 */

/*
类 对象 知识点
// ==================== 模块一：类 ====================
// 定义：使用 class 关键字，是生产对象的模板/图纸。
// 组成：
// 1. constructor (构造函数)：必须有，用于初始化实例属性。
// 2. 实例属性/方法：定义实例具备的状态和行为。
// 3. 静态属性/方法 (static)：属于类本身的，不需要实例化即可使用。

class Car {
  // [静态属性]：属于类本身的配置，所有实例共享，不用 new 直接用
  static category = '交通工具';

  // [构造函数]：必须存在，初始化实例的专属属性
  constructor(brand, color) {
    // [实例属性]：通过 this 挂载，每个实例独有
    this.brand = brand;
    this.color = color;
  }

  // [实例方法]：定义行为逻辑
  drive() {
    console.log(`${this.brand} 正在行驶...`);
  }
}

// ==================== 模块二：实例对象 ====================
// 定义：通过 new 类名() 生成的具体实体。
// 特点：
// 1. 依赖类：必须基于类来实例化。
// 2. 具象化：它是图纸（类）变成的现实产品。
// 3. 动态能力：既有属性（状态），又有方法（行为），是实实在在可操作的个体。

// 实例化过程：使用 new 关键字
const myCar = new Car('宝马', '黑色');

// [区别对比]
// 1. 既有属性：存储状态
console.log(myCar.brand); // 输出: 宝马

// 2. 又有方法：执行行为 (与配置对象的本质区别)
myCar.drive(); // 输出: 宝马 正在行驶...

// 它是“活”的实例，可以调用类里定义的方法。

// ==================== 模块三：配置对象 ====================
// 定义：使用 {} 定义的纯数据对象，非类实例化而来。
// 特点：
// 1. 主要是静态数据：只包含属性，用于描述信息。
// 2. 无方法：通常没有函数逻辑，只是数据的存储容器。
// 作用：用于路由配置、UI 组件参数传递、前后端数据传输。

const carConfig = {
  // 纯静态数据存储
  brand: '特斯拉',
  color: '红色',
  price: 300000,

  // 典型应用场景：
  // 1. 路由配置表 (path, component 等)
  // 2. 组件 props 传递
  // 3. API 请求参数
};

// 注意：配置对象是“死”的说明书，无法调用方法，只能存数据。

// ==================== 终极总结：关系网 ====================

// --- 类是图纸 ---
class User {}          // 自定义类
// Array, Date         // 内置类

// --- 对象是实体 ---
const config = {};     // 【配置对象】：数据载体（静态）
const user  = new User(); // 【实例对象】：功能实体（动态，源于类）

// --- 特殊对象（无图纸，直接存在） ---
window.localStorage;   // 【宿主对象】：环境赋予
JSON, Math;            // 【静态对象】：工具集合

*/
