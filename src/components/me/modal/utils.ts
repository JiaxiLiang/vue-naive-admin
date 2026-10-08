// 弹窗拖拽能力：以 bar（弹窗表头）为把手拖动 box（弹窗容器），供 MeModal 每次打开后绑定

// 兼容 IE 的 currentStyle 仅为类型补声明，现代浏览器运行时恒走 getComputedStyle
interface ElementWithCurrentStyle extends HTMLElement {
  currentStyle?: CSSStyleDeclaration
}

function getCss(element: HTMLElement, key: string): string | undefined {
  const style = (element as ElementWithCurrentStyle).currentStyle ?? window.getComputedStyle(element, null)
  return style.getPropertyValue(key)
}

/**
 * 绑定拖拽：bar 为拖动把手（弹窗表头），box 为被移动的弹窗容器，任一为空直接跳过
 * 注意 document 级监听会被下一次调用覆盖，多弹窗叠层时以最后一次绑定为准
 */
export function initDrag(bar: HTMLElement | null | undefined, box: HTMLElement | null | undefined): void {
  if (!bar || !box)
    return
  // left/top 记录容器当前定位（getCss 返回 '10px' 这类字符串），currentX/Y 记录按下时的鼠标位置
  const params = {
    left: 0 as number | string,
    top: 0 as number | string,
    currentX: 0,
    currentY: 0,
    flag: false,
  }

  // 容器定位为 auto（尚未定位过）时不记录，避免把 auto 当数值解析
  if (getCss(box, 'left') !== 'auto') {
    params.left = getCss(box, 'left')!
  }
  if (getCss(box, 'top') !== 'auto') {
    params.top = getCss(box, 'top')!
  }

  bar.style.cursor = 'move'
  // 按下：记录鼠标起点并置拖拽标志
  bar.onmousedown = function (e) {
    params.flag = true
    e.preventDefault() // 防止拖动时选中文本
    params.currentX = e.clientX
    params.currentY = e.clientY
  }
  // 抬起：结束拖拽，并把容器此刻位置存为下次位移的基准
  document.onmouseup = function () {
    params.flag = false
    if (getCss(box, 'left') !== 'auto') {
      params.left = getCss(box, 'left')!
    }
    if (getCss(box, 'top') !== 'auto') {
      params.top = getCss(box, 'top')!
    }
  }
  // 移动：仅拖拽中生效，按鼠标位移同步更新容器 left/top
  document.onmousemove = function (e) {
    if (e.target !== bar && !params.flag)
      return

    e.preventDefault()
    if (params.flag) {
      const nowX = e.clientX
      const nowY = e.clientY
      const disX = nowX - params.currentX
      const disY = nowY - params.currentY

      const left = Number.parseInt(params.left as string) + disX
      const top = Number.parseInt(params.top as string) + disY

      box.style.left = `${left}px`
      box.style.top = `${top}px`
    }
  }
}
