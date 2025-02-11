import domtoimage from 'dom-to-image'

/**
 * 导出 HTML 内容为图片
 * @param _primaryColor - 主题色
 * @returns 返回图片的 URL
 */
export async function exportImage(_primaryColor: string): Promise<string> {
  const element = document.querySelector(`#output`)!

  // 添加渲染状态检查
  await nextTick() // 等待 DOM 更新
  await new Promise(resolve => requestAnimationFrame(resolve)) // 等待下一帧渲染

  // 创建临时容器（增加尺寸验证）
  const container = document.createElement(`div`)
  const originalWidth = element.clientWidth || 800 // 默认宽度
  const originalHeight = element.scrollHeight || 600 // 默认高度

  Object.assign(container.style, {
    position: `fixed`,
    left: `-9999px`,
    width: `${originalWidth}px`,
    height: `${originalHeight}px`, // 明确高度
    overflow: `visible`, // 确保内容可见
    background: `#ffffff`,
    padding: `20px`,
    zIndex: `9999`, // 确保层级最高
  })

  // 深度克隆（包含子元素样式）
  const clone = element.cloneNode(true) as HTMLElement
  clone.style.cssText = window.getComputedStyle(element).cssText // 继承计算样式
  clone.style.width = `100%`
  clone.style.height = `auto`

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

  // 处理图片预加载（关键修复点）
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
    // 等待资源加载（关键步骤）
    await preloadImages()
    await document.fonts.ready // 等待字体加载

    // 添加渲染保障
    await new Promise(resolve => setTimeout(resolve, 100))

    // 生成图片（调整参数）
    return await domtoimage.toPng(container, {
      quality: 1, // 最高质量
      bgcolor: `#ffffff`,
      width: originalWidth,
      height: originalHeight,
      style: {
        transform: `none`,
        visibility: `visible`, // 强制可见
        opacity: `1`, // 防止透明
      },
      filter: (node) => {
        if (node instanceof HTMLElement) {
          // 过滤隐藏元素
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
