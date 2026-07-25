import { createStorage } from './storage' // 从相对路径引入通用的存储创建工厂函数

const prefixKey = 'vue-naive-admin_' // 定义全局默认的存储键名前缀，用于区分项目避免冲突

export function createLocalStorage(option = {}) { // 导出创建 localStorage 实例的工厂函数，参数默认为空对象
  return createStorage({ // 调用底层的 createStorage 方法并返回结果
    prefixKey: option.prefixKey || '', // 优先使用传入的自定义前缀，否则默认为空字符串
    storage: localStorage, // 指定使用浏览器的 localStorage 作为底层存储介质（持久化）
  })
}

export function createSessionStorage(option = {}) { // 导出创建 sessionStorage 实例的工厂函数
  return createStorage({ // 调用底层的 createStorage 方法并返回结果
    prefixKey: option.prefixKey || '', // 优先使用传入的自定义前缀，否则默认为空字符串
    storage: sessionStorage, // 指定使用浏览器的 sessionStorage 作为底层存储介质（会话级）
  })
}

export const lStorage = createLocalStorage({ prefixKey }) // 实例化并导出默认的 localStorage 对象，应用全局前缀

export const sStorage = createSessionStorage({ prefixKey })
// 实例化并导出默认的 sessionStorage 对象，应用全局前缀
/*
字符串知识点
split()
    作用：将字符串按照分隔符拆分为数组（用于字符串转数组，如解析 CSV 数据）。
    参数：separator（分隔符，可以是字符串或正则），limit（可选，返回数组的最大长度）。
    示例：
      const str = 'a,b,c';
      const arr = str.split(','); // 按逗号分割
      console.log(arr); // ['a', 'b', 'c']

slice()
    作用：提取字符串的某个部分，返回新字符串（不修改原字符串，类似数组的 slice）。
    参数：start（开始索引），end（结束索引，不包含该位置，可选）。
    示例：
      const str = 'hello world';
      const newStr = str.slice(0, 5); // 截取索引 0 到 4 的字符
      console.log(newStr); // 'hello'

replace()
    作用：替换匹配的子字符串（默认只替换第一个匹配项，配合正则 /g 可替换全部）。
    参数：searchValue（被替换的字符串或正则），replaceValue（替换后的字符串）。
    示例：
      const str = 'vue-admin';
      const newStr = str.replace('-', '_'); // 将第一个 - 替换为 _
      console.log(newStr); // 'vue_admin'

includes()
    作用：判断字符串是否包含指定的子字符串（返回布尔值，常用于权限校验、关键词搜索）。
    参数：searchString（要查找的子串），position（可选，开始查找的位置）。
    示例：
      const str = 'admin@system.com';
      const hasAdmin = str.includes('admin');
      console.log(hasAdmin); // true

indexOf()
    作用：查找子字符串第一次出现的位置（返回索引，如果不存在返回 -1，常用于判断是否存在）。
    参数：searchValue（要查找的子串），fromIndex（可选，开始查找的位置）。
    示例：
      const str = 'vue-naive-admin';
      const index = str.indexOf('-'); // 查找 - 第一次出现的位置
      console.log(index); // 4

toLowerCase() / toUpperCase()
    作用：将字符串全部转为小写或大写（常用于不区分大小写的比较，如验证码校验）。
    示例：
      const str = 'Vue';
      console.log(str.toLowerCase()); // 'vue'
      console.log(str.toUpperCase()); // 'VUE'

trim()
    作用：去除字符串首尾的空白字符（常用于表单输入校验，防止用户误输入空格）。
    示例：
      const str = '  hello  ';
      console.log(str.trim()); // 'hello' (中间空格保留)

startsWith() / endsWith()
    作用：判断字符串是否以指定子串开头或结尾（返回布尔值，常用于判断 URL 协议、文件后缀）。
    示例：
      const url = 'https://google.com';
      console.log(url.startsWith('https')); // true
      console.log(url.endsWith('.com'));    // true
*/

/*
====================================================================
if try...catch知识点
===================================================================

// -------------------- 一、if 语句 (条件判断) --------------------
// [核心作用]：逻辑分岔路口，根据条件真假决定执行路径。
// [视觉特点]：关键字 if/else，条件包裹在 () 中，执行体包裹在 {} 中。

const val = localStorage.getItem('token');

// 1. 基础判断：单路分支
if (!val) {
    // 条件为真时执行
    console.log('无数据，请先登录');
}

// 2. 复合判断：多路分支
if (val === 'admin') {
    console.log('管理员权限');
} else if (val === 'user') {
    console.log('普通用户');
} else {
    console.log('游客模式'); // 兜底逻辑
}
// -------------------- 二、try...catch (异常捕获) --------------------
// [核心作用]：代码安全气囊，防止因运行时错误导致程序崩溃（如解析格式错误）。
// [视觉特点]：try { 可能报错的代码 } catch (error) { 补救措施 }。

// 模拟一个格式损坏的 JSON 字符串
const badJson = "{ name: 'Admin' "; // 缺少闭合引号，非法格式

try {
    // [try 区域]：尝试执行的代码，一旦报错立即跳转 catch，后续代码不执行
    const data = JSON.parse(badJson);
    console.log(data);
} catch (error) {
    // [catch 区域]：捕获错误后的补救措施，error 对象包含错误详情
    console.error('发生错误:', error.message);
    console.log('程序并未崩溃，继续执行');
}
// finally { ... } // 可选：无论成功失败，最后必做之事

// -------------------- 三、实战结合 --------------------
// 场景：Storage 类中的双重安全防线

function safeGet(key) {
    const rawVal = localStorage.getItem(key);

    // 【第一道防线：if】快速拦截空值 (业务逻辑判断)
    if (!rawVal) return null;

    // 【第二道防线：try...catch】拦截解析错误 (运行时安全)
    try {
        return JSON.parse(rawVal); // 尝试解析
    } catch (e) {
        console.error('数据损坏，已清理', e);
        localStorage.removeItem(key); // 补救：清除脏数据
        return null;
    }
}
*/
