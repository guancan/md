import domtoimage from 'dom-to-image'

/**
 * 导出 HTML 内容为图片
 * @param _primaryColor - 主题色
 * @param backgroundColor - 背景色
 * @param margins - 边距对象，包含上、右、下、左四个方向的边距
 * @param outputWidth - 输出宽度
 * @param sliceOptions - 分片配置
 * @param sliceOptions.enable - 是否启用分片（默认true）
 * @param sliceOptions.sliceHeight - 分片高度（默认800）
 * @param sliceOptions.redundancyPercent - 高度冗余百分比（默认5%）
 * @returns 返回图片的 URL 或分片 URL 数组
 */
export async function exportImage(
  _primaryColor: string,
  backgroundColor: string,
  margins = { top: 20, right: 20, bottom: 100, left: 20 },
  outputWidth: number = 560,
  sliceOptions: {
    enable?: boolean
    sliceHeight?: number
    redundancyPercent?: number
  } = { enable: true },
): Promise<string | string[]> {
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

    // 更新高度计算逻辑
    const exportHeight = clone.scrollHeight + margins.top + margins.bottom

    // 分片模式专用处理
    if (sliceOptions?.enable ?? true) {
      const {
        sliceHeight = 800,
        redundancyPercent = 5,
      } = sliceOptions || {}
      const totalHeight = clone.scrollHeight
      const overlap = sliceHeight * (redundancyPercent / 100)
      const effectiveHeight = sliceHeight - overlap

      // 修正分片数量计算（增加冗余补偿）
      const slices = Math.ceil((totalHeight + overlap) / effectiveHeight)

      const results: string[] = []

      // 创建分片专用容器（替代主容器）
      const sliceContainer = document.createElement(`div`)
      sliceContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${finalOutputWidth}px;
        height: ${effectiveHeight + margins.top + margins.bottom}px;
        overflow: hidden;
        background: ${backgroundColor};
        z-index: 9999;
        box-sizing: border-box;
        padding: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
      `
      document.body.appendChild(sliceContainer)

      // 直接使用克隆元素，避免主容器渲染
      for (let i = 0; i < slices; i++) {
        const sliceClone = clone.cloneNode(true) as HTMLElement
        const startY = i * effectiveHeight
        // 修正结束位置计算（允许超出一部分冗余）
        const endY = Math.min(
          startY + sliceHeight,
          totalHeight + overlap, // 新增补偿逻辑
        )
        const currentHeight = endY - startY

        // 设置分片样式
        sliceContainer.style.height = `${currentHeight + margins.top + margins.bottom}px`
        sliceClone.style.transform = `translateY(-${startY}px)`
        sliceClone.style.width = `${finalOutputWidth - margins.left - margins.right}px`
        sliceClone.style.height = `${currentHeight}px`

        // 新增图片预加载处理
        const slicePreload = () => {
          const images = sliceClone.querySelectorAll(`img`)
          return Promise.all(Array.from(images).map(img =>
            new Promise((resolve) => {
              if (img.complete)
                return resolve(true)
              img.onload = resolve
              img.onerror = resolve
            }),
          ))
        }

        sliceContainer.innerHTML = ``
        sliceContainer.appendChild(sliceClone)

        // 新增等待逻辑（与主容器保持一致）
        await slicePreload() // 等待分片图片加载
        await document.fonts.ready // 等待字体加载
        await new Promise(resolve => setTimeout(resolve, 500)) // 增加渲染等待时间

        // 仅调整分片容器位置
        sliceContainer.style.left = `0px`
        sliceContainer.style.top = `0px`
        await new Promise(resolve => requestAnimationFrame(resolve))
        void sliceContainer.offsetHeight

        const sliceDataUrl = await domtoimage.toPng(sliceContainer, {
          width: finalOutputWidth * 2,
          height: (currentHeight + margins.top + margins.bottom) * 2,
          style: {
            transform: `scale(2) translate(0, 0)`,
            transformOrigin: `top left`,
          },
          quality: 1,
          bgcolor: backgroundColor,
        })
        results.push(sliceDataUrl)

        sliceContainer.style.left = `-9999px`
      }

      document.body.removeChild(sliceContainer)
      return results
    }

    // 非分片模式使用主容器
    else {
      // 调整主容器位置
      container.style.left = `0px`
      container.style.top = `0px`
      container.style.zIndex = `9999`
      await new Promise(resolve => requestAnimationFrame(resolve))
      void container.offsetHeight

      return await domtoimage.toPng(container, {
        width: finalOutputWidth * 2,
        height: exportHeight * 2,
        style: {
          transform: `scale(2) translate(0, 0)`,
          transformOrigin: `top left`,
        },
        quality: 1,
        bgcolor: backgroundColor,
      })
    }
  }
  finally {
    // 仅清理主容器（分片容器已单独处理）
    if (container.parentElement) {
      document.body.removeChild(container)
    }
  }
}
