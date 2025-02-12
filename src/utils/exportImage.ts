import domtoimage from 'dom-to-image'

/**
 * 导出 HTML 内容为图片
 * @param _primaryColor - 主题色
 * @param backgroundColor - 背景色
 * @returns 返回图片的 URL
 */
export async function exportImage(
  _primaryColor: string,
  backgroundColor: string,
): Promise<string> {
  const element = document.querySelector(`#output`)!

  // 添加渲染状态检查
  await nextTick() // 等待 DOM 更新
  await new Promise(resolve => requestAnimationFrame(resolve)) // 等待下一帧渲染

  // 修改点1：增加尺寸计算日志
  console.log(`📏 原始元素尺寸 - clientWidth:`, element.clientWidth, `scrollHeight:`, element.scrollHeight)

  const container = document.createElement(`div`)
  const originalWidth = element.clientWidth || 800
  const originalHeight = element.scrollHeight || 600

  // 修改点2：添加容器尺寸验证
  console.log(`📦 容器初始尺寸:`, originalWidth, `x`, originalHeight)
  container.style.cssText = `
    position: fixed;
    left: -9999px;  // 移出可视区域
    top: 0;
    width: ${originalWidth}px;
    height: ${originalHeight}px;
    overflow: visible;
    background: ${backgroundColor};
    z-index: 9999;
    padding: 20px;
    color: ${window.getComputedStyle(element).color};
  `

  // 深度克隆时保留主题类名
  const clone = element.cloneNode(true) as HTMLElement
  clone.className = element.className // 保留原始类名
  Object.assign(clone.style, {
    width: `100%`,
    height: `auto`,
    position: `relative`,
    overflow: `visible`,
    transform: `none`,
    transformOrigin: `top left`,
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
    // 修改点3：在关键步骤添加尺寸日志
    console.log(`🖨️ 渲染前容器尺寸:`, container.offsetWidth, `x`, container.offsetHeight)
    console.log(`🖨️ 渲染前克隆元素尺寸:`, clone.offsetWidth, `x`, clone.offsetHeight)

    // 等待资源加载
    await preloadImages()
    await document.fonts.ready

    // 增加缓冲时间
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log(`✅ 资源加载完成`)
    console.log(`📐 容器尺寸:`, container.offsetWidth, `x`, container.offsetHeight)
    console.log(`🖼️ 包含图片数量:`, clone.querySelectorAll(`img`).length)

    // 新增渲染保障步骤
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    })

    // 在生成图片前临时显示
    container.style.left = `0px`
    container.style.top = `0px` // 临时定位到可视区域
    await new Promise(resolve => requestAnimationFrame(resolve)) // 等待布局更新

    // 替换原有调试代码
    if (import.meta.env.DEV) {
      console.log(`调试容器结构:`, container.outerHTML)
      // 使用透明边框调试
      container.style.boxShadow = `0 0 0 2px rgba(255,0,0,0.3)`
    }

    console.log(`🔄 最终克隆内容:`, `${clone.outerHTML.slice(0, 200)}...`) // 输出部分HTML结构
    console.log(`🎨 计算样式:`, window.getComputedStyle(clone).getPropertyValue(`opacity`))

    // 新增：强制同步布局
    void container.offsetHeight // 触发重排

    // 修改点4：最终尺寸验证
    console.log(`✅ 最终容器尺寸:`, container.offsetWidth, `x`, container.offsetHeight)
    console.log(`✅ 最终克隆元素尺寸:`, clone.offsetWidth, `x`, clone.offsetHeight)
    console.log(`✅ 容器滚动高度:`, container.scrollHeight)

    return await domtoimage.toPng(container, {
      // 修改点5：调整缩放逻辑
      width: container.offsetWidth * 2, // 使用实际计算的宽度
      height: container.scrollHeight * 2, // 使用滚动高度而不是固定值
      style: {
        transform: `scale(2)`,
        transformOrigin: `top left`,
      },
      quality: 1,
      bgcolor: backgroundColor,
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
