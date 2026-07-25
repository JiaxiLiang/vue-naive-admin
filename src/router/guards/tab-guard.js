import { useTabStore } from '@/store' // 用于操作标签页数据

export const EXCLUDE_TAB = ['/404', '/403', '/login'] // 导出常量 EXCLUDE_TAB，定义不需要在标签栏中显示的路由路径黑名单

export function createTabGuard(router) { // 导出函数 createTabGuard，接收 router 实例作为参数，用于创建标签页管理守卫
  router.afterEach((to) => {
    if (EXCLUDE_TAB.includes(to.path)) // 判断目标路由路径是否存在于黑名单中
      return // 若在黑名单中，则直接返回，不执行后续添加标签页的逻辑
    const tabStore = useTabStore() // 获取标签页状态管理实例（在守卫内部调用确保 Pinia 已初始化）
    const { name, fullPath: path } = to
    // 从to解构出路由名称 name赋值给{}的变量name，fullPath（完整路径）同理 重命名为 path
    const title = to.meta?.title// 如果 to.meta 存在，就取 to.meta.title 否则也不会报错
    // 使用可选链获取路由元信息中的标题
    const icon = to.meta?.icon // 使用可选链获取路由元信息中的图标
    const keepAlive = to.meta?.keepAlive // 使用可选链获取路由元信息中的缓存标识
    tabStore.addTab({ name, path, title, icon, keepAlive }) // 调用 store 中的 addTab 方法，将提取的路由信息对象添加到标签页列表中
  })
}

/*
                  [ 路由跳转成功: afterEach 触发 ]
                             │
                             ▼
            ┌─────────────────────────────────┐
            │ 步骤1: 检查路径是否在黑名单中?   │
            │  (EXCLUDE_TAB 包含该路径?)      │
            └─────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
          [ 是: 在列表内 ]        [ 否: 不在列表 ]
                 │                       │
                 │                       ▼
                 │         ┌───────────────────────────┐
                 │         │ 步骤2: 获取标签页仓库实例    │
                 │         │    useTabStore()          │
                 │         └───────────────────────────┘
                 │                       │
                 │                       ▼
                 │         ┌───────────────────────────┐
                 │         │ 步骤3: 解构提取路由信息     │
                 │         │ name, fullPath, title     │
                 │         │ icon, keepAlive           │
                 │         └───────────────────────────┘
                 │                       │
                 │                       ▼
                 │         ┌───────────────────────────┐
                 │         │ 步骤4: 更新状态仓库         │
                 │         │  tabStore.addTab()        │
                 │         └───────────────────────────┘
                 │                       │
                 └───────────┬───────────┘
                             ▼
                       [ 流程执行结束 ]

*/

/* 解构的本质就是在对象里面提取某属性的值给到变量
属性:变量   这是基本的形式
 * 对象解构：通过{}按属性名提取值，核心知识点
// 1. 基本解构：按属性名提取
const user = { name: 'Alice', age: 25, city: 'Beijing' };
const { name, age } = user; // 提取name和age
console.log(name); // 输出：Alice
console.log(age);  // 输出：25

// 2. 别名：解决变量名冲突
const { name: userName, age } = user; // 将name重命名为userName
console.log(userName); // 输出：Alice
console.log(age);      // 输出：25

// 3. 默认值：属性不存在时使用默认值
const { name, gender = 'female' } = user; // gender不存在，使用默认值'female'
console.log(gender); // 输出：female

// 4. 嵌套解构：处理嵌套对象
const nestedUser = {
  name: 'Bob',
  address: { city: 'Shanghai', street: 'Nanjing Rd' }
};
const { address: { city, street } } = nestedUser; // 嵌套提取city和street
console.log(city);   // 输出：Shanghai
console.log(street); // 输出：Nanjing Rd

// 5. 动态属性名解构：属性名由变量动态指定
const propName = 'name';
const { [propName]: value } = user; // 动态提取propName对应的值
console.log(value); // 输出：Alice

// 6. 解构参数：函数参数解构
function printUser({ name, age }) { // 函数参数直接解构
  console.log(`Name: ${name}, Age: ${age}`);
}
printUser(user); // 输出：Name: Alice, Age: 25

// 7. 解构未声明变量：需用括号包裹
({ name, age } = user); // 解构未声明的变量需括号
console.log(name); // 输出：Alice

* 数组解构：通过[]按索引提取值，核心知识点
// 1. 基本解构：按索引提取
const numbers = [10, 20, 30];
const [a, b] = numbers; // 提取第一个和第二个元素
console.log(a); // 输出：10
console.log(b); // 输出：20

// 2. 跳过元素：用逗号占位
const [first, , third] = numbers; // 跳过第二个元素
console.log(first); // 输出：10
console.log(third); // 输出：30

// 3. 剩余元素：用...收集剩余值
const [head, ...tail] = numbers; // head取第一个，tail收集剩余元素
console.log(head);  // 输出：10
console.log(tail);  // 输出：[20, 30]

// 4. 默认值：元素不存在时使用默认值
const [x, y = 20] = [10]; // y不存在，使用默认值20
console.log(y); // 输出：20

// 5. 交换变量：解构简化交换
let m = 1, n = 2;
[m, n] = [n, m]; // 交换m和n的值
console.log(m); // 输出：2
console.log(n); // 输出：1

// 6. 解构参数：函数参数解构
function printNumbers([first, second]) { // 函数参数直接解构
  console.log(`First: ${first}, Second: ${second}`);
}
printNumbers(numbers); // 输出：First: 10, Second: 20

// 7. 解构未声明变量：需用括号包裹
([a, b] = numbers); // 解构未声明的变量需括号
console.log(a); // 输出：10

*/
