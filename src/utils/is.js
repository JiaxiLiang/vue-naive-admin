// 判断是否为数组、对象、字符串等工具集
const toString = Object.prototype.toString
// 获取 Object 原型上的 toString 方法，用于精准判断类型
// obj是js原生原始对象 prototype是公共工具箱 toString对象转换成字符串
// 一定要找到最初的原始函数是其他的继承的tostring做了改变 原始函数是最纯粹的

export function is(val, type) { // 定义通用类型判断函数 参数是 值和类型
  return toString.call(val) === `[object ${type}]`// 原始函数的返回值就是[object 类型]这个格式
  // 通过原型链调用，比对 [object Type] 字符串
  // call改变函数运行时的 this 指向 让原始函数作用于val
}// JS 是动态语言，数组对象等等都是衍生在 Object，所以就要用这个函数来准确判断值跟类是否匹配

export function isDef(val) { // 判断值是否已定义
  return typeof val !== 'undefined' // 如果不是 undefined 则返回 true
}

export function isUndef(val) { // 判断值是否未定义
  return typeof val === 'undefined' // 如果是 undefined 则返回 true
}// typeof是运算符直接得出变量的类型

export function isNull(val) { // 判断值是否为 null
  return val === null // 严格等于 null
}

export function isWhitespace(val) { // 判断值是否为空字符串
  return val === '' // 严格等于空字符串
}

export function isObject(val) { // 判断值是否为普通对象
  return !isNull(val) && is(val, 'Object') // 排除 null，且类型为 Object
}

export function isArray(val) { // 判断值是否为数组
  return val && Array.isArray(val) // 存在值且原生方法判断为数组
}
// Array：是构造函数对象 方法isArray判断是否为数组
export function isString(val) { // 判断值是否为字符串
  return is(val, 'String') // 调用通用判断方法
}

export function isNumber(val) { // 判断值是否为数字
  return is(val, 'Number') // 调用通用判断方法
}

export function isBoolean(val) { // 判断值是否为布尔值
  return is(val, 'Boolean') // 调用通用判断方法
}

export function isDate(val) { // 判断值是否为日期对象
  return is(val, 'Date') // 调用通用判断方法
}

export function isRegExp(val) { // 判断值是否为正则对象
  return is(val, 'RegExp') // 调用通用判断方法
}

export function isFunction(val) { // 判断值是否为函数
  return typeof val === 'function' // 使用 typeof 判断 function 类型
}

export function isPromise(val) { // 判断值是否为 Promise 对象
  return is(val, 'Promise') && isObject(val) && isFunction(val.then) && isFunction(val.catch) // 综合判断类型、对象特征及 then/catch 方法
}

export function isElement(val) { // 判断值是否为 DOM 元素
  return isObject(val) && !!val.tagName // 是对象且拥有 tagName 属性
}//  tagname是DOM 元素（HTML 标签）的固有属性 这里用来判断

export function isWindow(val) { // 判断值是否为 Window 对象
  return typeof window !== 'undefined' && isDef(window) && is(val, 'Window') // 确保环境存在 Window 且类型匹配
}

export function isNullOrUndef(val) { // 判断值是否为 null 或 undefined
  return isNull(val) || isUndef(val) // 满足其一即为真
}

export function isNullOrWhitespace(val) { // 判断值是否为 null、undefined 或空字符串
  return isNullOrUndef(val) || isWhitespace(val) // 满足其一即为真
}

/** 空数组 | 空字符串 | 空对象 | 空Map | 空Set */
export function isEmpty(val) { // 判断值是否为“空”（涵盖多种数据结构）
  if (isArray(val) || isString(val)) { // 如果是数组或字符串
    return val.length === 0 // 判断长度是否为 0
  }// length数组 字符串都有

  if (val instanceof Map || val instanceof Set) { // 如果是 Map 或 Set
    return val.size === 0 // 判断 size 是否为 0
  }

  if (isObject(val)) { // 如果是普通对象
    return Object.keys(val).length === 0 // 判断键的数量是否为 0
  }// keys方法把对象的属性提出出来组合成数组

  return false // 其他情况默认不为空
}

/**
 * 类似mysql的IFNULL函数
 *
 * @param {number | boolean | string} val
 * @param {number | boolean | string} def
 * @returns 第一个参数为null | undefined | '' 则返回第二个参数作为备用值，否则返回第一个参数
 */
export function ifNull(val, def = '') { // 空值合并函数，类似 SQL 的 IFNULL
  return isNullOrWhitespace(val) ? def : val // 如果为空值则返回默认值，否则返回原值
}

export function isUrl(path) { // 判断字符串是否为 URL 格式
  const reg = /^https?:\/\/[-\w+&@#/%?=~|!:,.;]+[-\w+&@#/%=~|]$/ // URL 正则表达式
  return reg.test(path) // 校验路径
}

/**
 * @param {string} path
 * @returns {boolean} 是否是外部链接
 */
export function isExternal(path) { // 判断是否为外部链接
  return /^https?:|mailto:|tel:/.test(path) // 匹配 http/https/mailto/tel 协议头
}

export const isServer = typeof window === 'undefined' // 判断当前运行环境是否为服务端（无 window 对象）

export const isClient = !isServer // 判断当前运行环境是否为客户端（浏览器）
