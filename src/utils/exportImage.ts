import html2canvas from 'html2canvas'

/**
 * 导出 HTML 内容为图片
 * @param primaryColor - 主题色
 * @returns 返回图片的 URL
 */
export async function exportImage(primaryColor: string): Promise<string> {
  // 复用现有的 HTML 渲染逻辑
  const element = document.querySelector(`#output`)!
  
  // 复用现有的样式处理
  const htmlStr = element.innerHTML
    .replace(/var\(--md-primary-color\)/g, primaryColor)
    .replace(/--md-primary-color:.+?;/g, ``)

  // 创建临时容器
  const container = document.createElement('div')
  container.style.width = '750px'
  container.style.margin = 'auto'
  container.style.background = '#ffffff'
  container.style.padding = '20px'
  container.innerHTML = htmlStr
  
  // 临时添加到 body
  document.body.appendChild(container)

  try {
    // 使用 html2canvas 转换为图片
    const canvas = await html2canvas(container, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片
      backgroundColor: '#ffffff'
    })

    return canvas.toDataURL('image/png')
  } finally {
    // 清理临时元素
    document.body.removeChild(container)
  }
}