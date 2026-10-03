// 获取元素的CSS样式
interface ElementWithCurrentStyle extends HTMLElement {
  /** IE 专属属性，现代浏览器走 getComputedStyle */
  currentStyle?: CSSStyleDeclaration
}

function getCss(element: HTMLElement, key: string): string | undefined {
  // CSSStyleDeclaration 无通用字符串索引签名，断言后按 key 取值
  const style = (element as ElementWithCurrentStyle).currentStyle ?? window.getComputedStyle(element, null)
  return (style as any)[key]
}

// 初始化拖拽
export function initDrag(bar: HTMLElement | null | undefined, box: HTMLElement | null | undefined): void {
  if (!bar || !box)
    return
  // left/top 运行时可能是 '10px' 这类字符串（getCss 的返回值），parseInt 时统一处理
  const params = {
    left: 0 as number | string,
    top: 0 as number | string,
    currentX: 0,
    currentY: 0,
    flag: false,
  }

  if (getCss(box, 'left') !== 'auto') {
    params.left = getCss(box, 'left')!
  }
  if (getCss(box, 'top') !== 'auto') {
    params.top = getCss(box, 'top')!
  }

  // 设置触发拖动元素的鼠标样式为移动图标
  bar.style.cursor = 'move'
  // 鼠标按下事件处理函数
  bar.onmousedown = function (e) {
    params.flag = true // 设置拖拽标志为true
    e.preventDefault() // 阻止默认事件
    params.currentX = e.clientX // 鼠标当前位置的X坐标
    params.currentY = e.clientY // 鼠标当前位置的Y坐标
  }
  document.onmouseup = function () {
    params.flag = false // 设置拖拽标志为false
    if (getCss(box, 'left') !== 'auto') {
      params.left = getCss(box, 'left')!
    }
    if (getCss(box, 'top') !== 'auto') {
      params.top = getCss(box, 'top')!
    }
  }
  document.onmousemove = function (e) {
    if (e.target !== bar && !params.flag)
      return

    e.preventDefault() // 阻止默认事件
    // 如果拖拽标志为true
    if (params.flag) {
      const nowX = e.clientX // 鼠标当前位置的X坐标
      const nowY = e.clientY // 鼠标当前位置的Y坐标
      const disX = nowX - params.currentX // 鼠标移动的X距离
      const disY = nowY - params.currentY // 鼠标移动的Y距离

      const left = Number.parseInt(params.left as string) + disX // 盒子元素的新left值
      const top = Number.parseInt(params.top as string) + disY // 盒子元素的新top值

      box.style.left = `${left}px`
      box.style.top = `${top}px`
    }
  }
}
