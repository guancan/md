import domtoimage from 'dom-to-image'

/**
 * 导出 HTML 内容为图片
 * @param _primaryColor - 主题色
 * @param backgroundColor - 背景色
 * @param margins - 边距对象，包含上、右、下、左四个方向的边距
 * @param outputWidth - 输出宽度
 * @returns 返回图片的 URL
 */
export async function exportImage(
  _primaryColor: string,
  backgroundColor: string,
  margins = { top: 50, right: 30, bottom: 100, left: 30 },
  outputWidth: number = 560,
): Promise<string> {
  const element = document.querySelector(`#output`)!

  // 等待 DOM 更新完成
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))

  const container = document.createElement(`div`)
  const originalWidth = element.clientWidth || 800
  const originalHeight = element.scrollHeight || 600

  // 计算实际使用的输出宽度和内容宽度
  const finalOutputWidth = outputWidth || (originalWidth + margins.left + margins.right)
  const contentWidth = finalOutputWidth - margins.left - margins.right

  if (import.meta.env.DEV) {
    console.log(`📐 原始尺寸:`, { width: originalWidth, height: originalHeight })
  }

  // 设置临时容器样式
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${finalOutputWidth}px;
    height: auto;
    overflow: visible;
    background: ${backgroundColor};
    z-index: 9999;
    padding: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
    color: ${window.getComputedStyle(element).color};
    box-sizing: border-box;
  `

  // 深度克隆时保留主题类名
  const clone = element.cloneNode(true) as HTMLElement
  clone.className = element.className // 保留原始类名
  Object.assign(clone.style, {
    width: `${contentWidth}px`,
    height: `auto`,
    position: `relative`,
    overflow: `visible`,
    transform: `none`,
    transformOrigin: `top left`,
    marginBottom: `0`,
  })

  // 处理动态样式（参考 demo 实现）
  const styleSheets = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join(``)
      }
      catch {
        return ``
      }
    })
    .join(``)

  const styleTag = document.createElement(`style`)
  styleTag.textContent = styleSheets

  // 处理图片预加载
  const preloadImages = () => {
    const images = clone.querySelectorAll(`img`)
    return Promise.all(Array.from(images).map((img) => {
      return new Promise((resolve) => {
        if (img.complete)
          return resolve(true)
        img.onload = resolve
        img.onerror = resolve
      })
    }))
  }

  container.appendChild(styleTag)
  container.appendChild(clone)
  document.body.appendChild(container)

  try {
    // 等待资源加载
    await preloadImages()
    await document.fonts.ready
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (import.meta.env.DEV) {
      // 输出关键调试信息
      console.groupCollapsed(`🔍 导出调试信息`)
      console.log(`容器尺寸:`, {
        width: container.offsetWidth,
        height: container.offsetHeight,
        scrollHeight: container.scrollHeight,
      })
      console.log(`图片数量:`, clone.querySelectorAll(`img`).length)
      console.log(`容器结构:`, container.outerHTML)
      console.groupEnd()
    }

    // 确保渲染完成
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    })

    // 调整容器位置用于捕获
    container.style.left = `0px`
    container.style.top = `0px`
    container.style.zIndex = `9999`
    await new Promise(resolve => requestAnimationFrame(resolve))

    // 强制同步布局
    void container.offsetHeight

    if (import.meta.env.DEV) {
      console.log(`📸 导出参数:`, {
        width: finalOutputWidth * 2,
        height: (container.scrollHeight) * 2,
        margins,
      })
    }

    // 更新高度计算逻辑
    const exportHeight = clone.scrollHeight + margins.top + margins.bottom

    // 调整缩放参数
    return await domtoimage.toPng(container, {
      width: finalOutputWidth * 2,
      height: exportHeight * 2,
      style: {
        transform: `scale(2) translate(0, 0)`,
        transformOrigin: `top left`,
      },
      quality: 1,
      bgcolor: backgroundColor,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          const style = window.getComputedStyle(node)
          return style.display !== `none`
            && style.visibility !== `hidden`
            && style.opacity !== `0`
        }
        return true
      },
    })
  }
  finally {
    document.body.removeChild(container)
  }
}
