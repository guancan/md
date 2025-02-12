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

  container.style.cssText = `
    position: fixed;
    left: -9999px;  // 移出可视区域
    top: 0;
    width: ${originalWidth}px;
    height: ${originalHeight}px;
    overflow: visible;
    background: #fff;
    z-index: 9999;
    padding: 20px;
  `

  // 深度克隆（包含子元素样式）
  const clone = element.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    width: `100%`,
    height: `auto`,
    position: `relative`, // 新增定位方式
    overflow: `visible`,
    transform: `none`, // 重置变换
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
    // 等待资源加载
    await preloadImages()
    await document.fonts.ready

    // 新增调试环节（仅开发环境）
    if (import.meta.env.DEV) {
      // 显示临时容器
      container.style.left = `0px`
      container.style.top = `0px`
      container.style.boxShadow = `0 0 0 3px rgba(255,0,0,0.8)` // 红色高亮边框

      // 创建调试浮层
      const debugOverlay = document.createElement(`div`)
      debugOverlay.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2em;
        `
      debugOverlay.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px;">
                <div>临时容器预览（3秒后关闭）</div>
                <div>实际尺寸：${container.offsetWidth} x ${container.offsetHeight}</div>
            </div>
        `

      document.body.appendChild(debugOverlay)

      // 设置3秒后自动清除
      setTimeout(() => {
        document.body.removeChild(debugOverlay)
        container.style.left = `-9999px`
      }, 3000)

      // 暂停后续流程
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    console.log(`✅ 资源加载完成`)
    console.log(`📐 容器尺寸:`, container.offsetWidth, `x`, container.offsetHeight)
    console.log(`🖼️ 包含图片数量:`, clone.querySelectorAll(`img`).length)

    // 新增渲染保障步骤
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    })

    // 在生成图片前临时显示
    container.style.left = `0px` // 临时定位到可视区域
    await new Promise(resolve => requestAnimationFrame(resolve)) // 等待布局更新

    // 替换原有调试代码
    if (import.meta.env.DEV) {
      console.log(`调试容器结构:`, container.outerHTML)
      // 使用透明边框调试
      container.style.boxShadow = `0 0 0 2px rgba(255,0,0,0.3)`
    }

    console.log(`🔄 最终克隆内容:`, `${clone.outerHTML.slice(0, 200)}...`) // 输出部分HTML结构
    console.log(`🎨 计算样式:`, window.getComputedStyle(clone).getPropertyValue(`opacity`))

    return await domtoimage.toPng(container, {
      quality: 1,
      bgcolor: `#ffffff`,
      width: originalWidth * 2, // 添加 2 倍缩放（解决高分屏问题）
      height: originalHeight * 2,
      style: {
        transform: `scale(2)`, // 匹配缩放
        transformOrigin: `top left`,
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
